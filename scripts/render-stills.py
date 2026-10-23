"""Studio renders of the Facade scanner concept and the sample wall for the site's grid.

Run with a Python that has Blender's bpy module:
  python scripts/render-stills.py --scanner PATH/facade-scanner.glb --wall PATH/sample-wall.blend [--only NAME] [--samples N]
Writes PNGs to assets/renders/. Geometry and materials come from the models as exported; only lights, a grey
photo sweep and cameras are added here.
"""
import argparse, math, os, sys
import bpy
from mathutils import Vector, Matrix

ap = argparse.ArgumentParser()
ap.add_argument('--scanner'); ap.add_argument('--wall'); ap.add_argument('--only', default='')
ap.add_argument('--samples', type=int, default=160); ap.add_argument('--scale', type=float, default=1.0)
args = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'renders')
os.makedirs(OUT, exist_ok=True)


def setup_render(w, h):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    try:
        prefs.compute_device_type = 'METAL'; prefs.get_devices()
        for d in prefs.devices: d.use = True
        sc.cycles.device = 'GPU'
    except Exception:
        sc.cycles.device = 'CPU'
    sc.cycles.samples = args.samples; sc.cycles.use_denoising = True
    sc.render.resolution_x = int(w * args.scale); sc.render.resolution_y = int(h * args.scale)
    sc.render.film_transparent = False
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'; sc.view_settings.exposure = -.35
    sc.render.image_settings.file_format = 'PNG'


def studio(center, size, floor_z, view, tone=0.5):
    """A seamless grey sweep that curves up behind the subject as seen from `view` (the camera direction), a big
    soft key from camera left, a fill from camera right, a rim from behind, and a dim grey world."""
    world = bpy.data.worlds.new('Studio'); bpy.context.scene.world = world; world.use_nodes = True
    bg = world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (tone * .9, tone * .9, tone * .88, 1); bg.inputs['Strength'].default_value = .22
    mat = bpy.data.materials.new('Sweep'); mat.use_nodes = True
    p = mat.node_tree.nodes['Principled BSDF']; p.inputs['Base Color'].default_value = (tone, tone, tone * .97, 1); p.inputs['Roughness'].default_value = .9
    # Sweep: a floor that curves up into a backdrop, far larger than the subject.
    s = size * 14
    bpy.ops.mesh.primitive_plane_add(size=1); sweep = bpy.context.object; sweep.name = 'Sweep'
    me = sweep.data; import bmesh
    bm = bmesh.new(); prof = []
    for i in range(25):
        t = i / 24
        if t < .55: prof.append((-s / 2 + t / .55 * s * .55, 0))
        else:
            a = (t - .55) / .45 * math.pi / 2; r = s * .25
            prof.append((s * .05 + math.sin(a) * r, r - math.cos(a) * r))
    verts = []
    for x in (-s, s):
        row = [bm.verts.new((x, y, z)) for y, z in prof]; verts.append(row)
    for i in range(len(prof) - 1):
        bm.faces.new((verts[0][i], verts[1][i], verts[1][i + 1], verts[0][i + 1]))
    bm.to_mesh(me); bm.free()
    d = Vector((view[0], view[1], 0)).normalized()
    sweep.location = (center.x, center.y, floor_z); sweep.rotation_euler = (0, 0, math.atan2(d.x, -d.y))
    me.materials.append(mat)
    for poly in me.polygons: poly.use_smooth = True

    def light(name, energy, loc, size_, color=(1, 1, 1)):
        d = bpy.data.lights.new(name, 'AREA'); d.energy = energy; d.size = size_; d.color = color
        o = bpy.data.objects.new(name, d); bpy.context.collection.objects.link(o); o.location = loc
        direction = center - Vector(loc); o.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        return o
    k = size; fwd = -d; right = fwd.cross(Vector((0, 0, 1))).normalized(); up = Vector((0, 0, 1))
    light('Key', 520 * k * k, center + (-right * 2.4 - fwd * 1.0 + up * 2.6) * k, 2.6 * k, (1, .96, .91))
    light('Fill', 120 * k * k, center + (right * 2.8 - fwd * 1.6 + up * 1.0) * k, 3.2 * k, (.9, .95, 1))
    light('Rim', 420 * k * k, center + (fwd * 2.6 + right * .6 + up * 2.0) * k, 1.6 * k)


def bounds(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs if o.type == 'MESH' for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi, pts


def camera(objs, direction, lens=70, margin=1.12, w=1600, h=1200, name='Cam', target=None):
    lo, hi, pts = bounds(objs); c = target or (lo + hi) / 2
    d = Vector(direction).normalized()
    cd = bpy.data.cameras.new(name); cd.lens = lens; cd.sensor_width = 36; cd.sensor_fit = 'HORIZONTAL'
    cam = bpy.data.objects.new(name, cd); bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam; setup_render(w, h)
    # Push back along the view direction until every bounding point sits inside the frame (with margin).
    lo_d, hi_d = .01, 200
    for _ in range(40):
        mid = (lo_d + hi_d) / 2; cam.location = c + d * mid
        cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler(); bpy.context.view_layer.update()
        ok = True
        mw = cam.matrix_world.inverted(); aspect = w / h; fx = cd.lens / cd.sensor_width * 2
        for p in pts:
            q = mw @ p
            if q.z >= 0: ok = False; break
            x = q.x / -q.z * fx; y = q.y / -q.z * fx * aspect
            if abs(x) * margin > 1 or abs(y) * margin > 1: ok = False; break
        if ok: hi_d = mid
        else: lo_d = mid
    cam.location = c + d * hi_d
    return cam


def render(name):
    path = os.path.join(OUT, name + '.png'); bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True); print('wrote', path)


def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def want(name): return not args.only or args.only in name


# ---------------- scanner ----------------
if args.scanner and (not args.only or args.only.startswith('scanner')):
    shots = {
        'scanner-front': dict(dir=(.55, 1, .55), lens=70),
        'scanner-exploded': dict(dir=(.6, 1, .75), lens=60, explode=1.7, h=1600, w=1280),
        'scanner-top': dict(dir=(.18, .3, 1), lens=70),
        'scanner-under': dict(dir=(.5, 1, .9), lens=70, flip=True),
        'scanner-rear': dict(dir=(-.45, -1, .45), lens=100, focus=['24_replaceable_rear_USB_panel', 'USB_C_A_THERMAL', 'USB_C_B_CONTROLLER', 'C_RGB_blank', 'rear_label'], margin=1.9),
        'scanner-nose': dict(dir=(.35, 1, .3), lens=100, focus=['19_flush_sensor_nose', '20_nose_service_cap', 'thermal_optic', '21_RGB_blank'], margin=1.5),
    }
    for name, s in shots.items():
        if not want(name): continue
        clear()
        bpy.ops.import_scene.gltf(filepath=args.scanner)
        meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
        for o in meshes:
            for poly in o.data.polygons: poly.use_smooth = poly.use_smooth
        if s.get('explode'):
            for o in meshes:
                off = o.get('explodedOffsetMetres')
                if off: o.location += Vector((off[0], -off[2], off[1])) * s['explode']
            bpy.context.view_layer.update()
        if s.get('flip'):
            root = bpy.data.objects.new('Flip', None); bpy.context.collection.objects.link(root)
            for o in meshes:
                if o.parent is None: o.parent = root
            root.rotation_euler = (0, math.pi, 0); bpy.context.view_layer.update()
        lo, hi, _ = bounds(meshes)
        if s.get('flip'):
            root.location.z -= lo.z; bpy.context.view_layer.update(); lo, hi, _ = bounds(meshes)
        size = max(hi - lo)
        studio((lo + hi) / 2, size, lo.z, s['dir'])
        focus = [o for o in meshes if any(o.name.startswith(f) for f in s.get('focus', []))] or meshes
        camera(focus, s['dir'], lens=s['lens'], margin=s.get('margin', 1.12), w=s.get('w', 1600), h=s.get('h', 1200))
        render(name)

# ---------------- sample wall ----------------
if args.wall and (not args.only or args.only.startswith('wall')):
    shots = {
        'wall-closed': dict(dir=(.75, -1, .32), lens=60, hide=[]),
        'wall-open': dict(dir=(.75, -1, .32), lens=60, hide=['Drywall']),
        'wall-exploded': dict(dir=(.9, -1, .42), lens=55, hide=[], explode=1.0, w=1280, h=1600),
        'wall-panel': dict(dir=(.35, -1, .15), lens=90, hide=['Drywall'], focus=['Load center', 'Panel door', 'Panel label', 'EMT to box'], margin=1.7),
        'wall-copper': dict(dir=(-.3, -1, .2), lens=90, hide=['Drywall'], focus=['Valve box', 'Ball valve', 'Valve handle', 'Copper tee'], margin=2.2),
    }
    for name, s in shots.items():
        if not want(name): continue
        bpy.ops.wm.open_mainfile(filepath=args.wall)
        roots = [o for o in bpy.data.objects if o.parent is None]
        for r in roots:
            if r.name in s['hide']:
                for o in [r, *r.children_recursive]: o.hide_render = True; o.hide_viewport = True
            elif s.get('explode') and 'explode' in r.keys():
                e = r['explode']; r.location += Vector((e[0], -e[2], e[1])) * s['explode']
        bpy.context.view_layer.update()
        meshes = [o for o in bpy.data.objects if o.type == 'MESH' and not o.hide_render]
        lo, hi, _ = bounds(meshes); size = max(hi - lo)
        for o in list(bpy.data.objects):
            if o.type == 'LIGHT': bpy.data.objects.remove(o)
        studio((lo + hi) / 2, size * .35, lo.z, s['dir'], tone=.55)
        focus = [o for o in meshes if any(o.name.startswith(f) for f in s.get('focus', []))] or meshes
        camera(focus, s['dir'], lens=s['lens'], margin=s.get('margin', 1.1), w=s.get('w', 1600), h=s.get('h', 1200))
        render(name)
