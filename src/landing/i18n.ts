import {createContext,useContext} from 'react';

/** The site's copy, in plain English. One language: the words are kept simple rather than translated. */
export type Lang='en';
export const languages:{code:Lang;name:string;tag:string}[]=[{code:'en',name:'English',tag:'en'}];

const en={
 docTitle:'Facade — Find what’s behind the wall before renovation',
 menu:{label:'Language',note:''},
 loading:'Loading',
 hero:{
  title:['FIND UNFORESEEN','CONDITIONS BEFORE','RENOVATION BEGINS.'],titleText:'Find unforeseen conditions before renovation begins.',
  sub:'Facade uses scanning technology to help renovation teams see what’s behind walls and plan their work before demolition.',
  demo:'Try the demo',savings:'Savings',waitlist:'Waitlist',linksLabel:'Savings and waitlist',
  legendLabel:'What’s inside the wall',systems:[['M','Heating and air'],['E','Electrical'],['P','Plumbing']],
  hintOpen:'Taken apart / drag to turn',hintClosed:'Scroll or drag to take it apart',
  caption:'Sample wall / for illustration',scroll:'Scroll',
 },
 inside:{eyebrow:'Inside the wall / 01',title:['See what’s','inside the wall.'],lede:'Behind the drywall are pipes, wires and air ducts. Most renovations rely on demolition to find out what’s in there, so unforeseen conditions only surface once the wall is open.'},
 wall:{
  aria:'A sample wall, opened up: metal studs, an air duct, drain pipes, copper water pipes, an electrical panel with its wiring, and insulation, behind a sheet of drywall. Scroll or drag to take it apart; arrow keys turn it.',
  loading:'Loading the wall',unavailable:'3D view unavailable in this browser',failed:'Wall unavailable',cursor:'Drag to take apart',
  labels:{Drywall:'Drywall',Electrical:'Wiring','Water supply':'Water pipes','Drain and vent':'Drain pipes',Mechanical:'Air duct',Insulation:'Insulation',Studs:'Metal studs'} as Record<string,string>,
 },
 kit:{
  eyebrow:'The scanner / 02',title:['The scanner,','taken apart.'],
  lede:'A handheld tool you roll along a wall. A FLIR Lepton 3.5 thermal camera (160 × 120) reads surface temperature through the nose, a coil on the underside senses metal through an inductance-to-digital interface, and an 18 mm roller with an AS5600 magnetic angle sensor tracks distance travelled to place each reading along the wall. A Feather RP2040 gathers the coil and roller data, both streams reach the computer over USB-C, and a bay underneath is held for radar.',
  link:'See the hardware',hintOpen:'Taken apart',hintClosed:'Scroll or drag to take it apart',caption:'Concept model / not final',
  viewer:{
   aria:'The Facade scanner, a concept model: shell and handle, sensor nose, heat camera, controller board, USB ports, space for radar, metal sensor, measuring wheel and screws. Scroll or drag to take it apart; arrow keys turn it.',
   loading:'Loading the scanner',unavailable:'3D view unavailable in this browser',failed:'Scanner unavailable',cursor:'Drag to take apart',
   labels:{enclosure:'01 Shell + handle',cameras:'02 Sensor nose',thermal:'03 Heat camera',electronics:'04 Controller board',cables:'05 USB ports',radar:'06 Space for radar',metal:'07 Metal sensor',tracking:'08 Measuring wheel',fasteners:'09 Screws'} as Record<string,string>,
  },
 },
 manifesto:{
  notes:'Field notes / 01',notesBig:'Look. Check. Decide.',record:['— All in','one',' place.'],eyebrow:'How it works',
  s1:{sr:'Good decisions start with what’s really there.',parts:['Good','decisions start with','what’s really there.'],tip:'Seen on site → proof'},
  s2:{sr:'Scan the wall, keep every finding with its proof, and let your team make the call.',parts:['Scan the','wall, keep every finding with its','proof, and let your team make the','call.']},
  body:'Scan walls, check what was found, and compare repair options, all in one place.',
 },
 collage:{
  ticker:'Facade — ',logLabel:'Sample list of findings',logNote:'Findings — sample data',cursor:'Scan',
  log:[['OBS-014','Air unit label','field-notes.txt / L12','Not checked'],['OBS-015','Roof unit age','Engineer estimate','Confirmed'],['OBS-016','Panel 2B size','survey.pdf / P4','Not enough proof'],['OBS-017','Duct in wall','photo-07.jpg','Check by eye'],['OBS-018','Chiller size','as-built.pdf / P2','Disputed'],['SRC-004','Survey table','survey.csv / ROW 18','Linked'],['OBS-019','Boiler size','Unknown','Missing']],
  title:['See the building','as it really is.'],essentially:'In short',
  p1:'A finding is a starting point. A document is not proof. A guess is not a measurement.',
  p2:'Facade keeps them apart, so you always know what is confirmed and what is not.',
  n1:'01 / Scan — record what is behind the wall.',n2:'02 / Link — every finding keeps its photo, file and notes.',
  showing:'Showing: sample data',n3:['03 / Decide — your','engineer',' makes the call.'],
 },
 drawings:{zoneA:'Zone A',zoneB:'Zone B',coverage:'Sample / area scanned',cost:'Sample / costs',options:['Keep','Upgrade','Replace'],draft:'Facade / draft',human:'A person checks',
  aria:['Sample floor plan showing the area scanned','Sample comparison of three repair options','Sample report with its sources']},
 exhibits:{
  heading:'What the software does.',hint:'(Drag to move / click to open)',cursor:'Drag / open',open:'{title}: open preview. Arrow keys move it.',close:'Close preview',
  opensAt:'Opens at →',next:'Next:',arrow:'→',illustrative:'Sample /',obj:{setBy:'Set by engineer',review:'Check',draft:'Draft',human:'A person checks'},
  items:{
   evidence:{title:'Site findings',label:'Record / check',desc:'Write down what was found on site and where. Each finding stays linked to its proof.',detail:'Anything unknown stays marked as unknown, so nothing is filled in by guesswork.',points:['Linked to where it came from','Unknowns stay visible','Sample data in the demo']},
   documents:{title:'Your files',label:'Upload / link',desc:'Add spreadsheets, text files and PDFs. Each finding points to the page or row it came from.',detail:'Photos can be attached for a person to look at. The app does not read photos by itself.',points:['Spreadsheets, text and PDF','Page and row links','Photos for people to check']},
   review:{title:'Checking findings',label:'Check / history',desc:'Each finding is marked not checked, confirmed, disputed or not enough proof. Confirming needs a named person.',detail:'Every change is kept, so you can see what changed and why.',points:['Four clear statuses','A name on every confirmation','Full change history']},
   requirements:{title:'What the job needs',label:'Set by your engineer',desc:'Your engineer sets what the system must do, such as how much cooling is needed.',detail:'Facade does not size equipment or approve designs. Those decisions stay with your engineer.',points:['Set by your engineer','Simple checklist','No automatic sizing']},
   options:{title:'Compare options',label:'Keep / upgrade / replace',desc:'See keep, upgrade and replace side by side: cost, downtime and what is still unknown.',detail:'Missing costs and unchecked options are flagged, so nothing is hidden.',points:['Three options side by side','Downtime limits','Missing details flagged']},
   calculations:{title:'Costs over time',label:'Costs / how it’s worked out',desc:'Upfront cost, running cost and future repairs, with every step of the math shown.',detail:'You can change every number. Results are estimates based on what you enter.',points:['Change any number','Math shown in full','Estimates, not promises']},
   report:{title:'Report for the owner',label:'Draft / PDF',desc:'Turn checked findings into a draft report with its sources and open questions.',detail:'Your team picks the option to recommend and explains why before it goes in the report.',points:['Your team picks the option','The reason in your words','Sources and open items included']},
   kit:{title:'The scanner',label:'Hardware / concept',desc:'A handheld scanner with a heat camera, a metal sensor, space for radar and a measuring wheel.',detail:'A concept model. Not final, and not connected to real hardware yet.',points:['Whole and taken apart','Every part labelled','Concept only']},
  },
 },
 savings:{eyebrow:'Time back',title:['Less paperwork.','More time to build.'],body:'See what fewer hours of sorting notes and writing reports could be worth to your team.',action:'Work out your savings',note:'Change any number. Estimates, not promises.',art:'Time / value'},
 questions:{
  title:['Good','to know.'],intro:'Simple answers to common questions:',
  items:[
   ['Does Facade design the system for me?','No. Your engineer decides what the building needs and which options make sense. Facade organises the evidence and compares the costs you enter.'],
   ['What can I add to a project?','Spreadsheets, text files and PDFs. Every finding stays linked to the file and page it came from. Photos can be added for a person to look at.'],
   ['What if some information is missing?','It stays marked as missing. You can add an estimate with a reason, and Facade shows anything the comparison still needs.'],
   ['Where is my data kept?','In your own browser, on this device. No account is needed. Clearing your browser data deletes it.'],
   ['Can I share the results?','Yes. Pick the option you recommend, explain why, and download a draft PDF report with its sources and open questions.'],
  ],
 },
 projects:{eyebrow:'Saved on this device',title:'Your projects.',note:'',demo:'Sample',local:'Your project',empty:'No projects yet',emptyBody:''},
 join:{eyebrow:'What’s next',title:['Be first','to try Facade.'],action:'Join the waitlist'},
 footer:{
  tagline:'See behind the wall before you open it.',judgment:'Your engineer makes the call.',top:'Top',cont:['More','here:'],navLabel:'Footer',pills:['Savings','Waitlist','Hardware'],
 },
 costs:{eyebrow:'The numbers / 03',title:['What surprises','cost.'],lede:'On a $1M renovation, surprises add about $35,600. The biggest part comes from things nobody could see.',rows:['Hidden problems','Design changes','Owner changes'],short:['Hidden','Design','Owner'],total:'Total extra',scenarios:['Found during the work','1 in 3 found before'],modesLabel:'Compare',replay:'Play again',savingsTag:'Example',savingsLine:'saved if a third of the hidden problems are found before work starts.',net:'Before the cost of scanning and checking.',source:'Based on a 2018 study of 161 school renovations, scaled to $1M.',sourceLink:'Study',calc:'Work out your own',savedShort:'Saved',aria:'A renovation site drawn in lines. Red lines, one per $1,000, rise from where each surprise comes from: $14,500 hidden problems, $13,600 design changes, $7,500 owner changes. Finding a third of the hidden problems early removes 5 lines, or $5,000.',loading:'Loading the site',failed:'Site unavailable',unavailable:'3D view unavailable in this browser',cursor:'Drag to look around'},
};
export type Copy=typeof en;

export const copy:Record<Lang,Copy>={en};
type LangState={lang:Lang;t:Copy;setLang:(lang:Lang)=>void};
const LangContext=createContext<LangState>({lang:'en',t:en,setLang:()=>{}});
export const LangProvider=LangContext.Provider;
export const useCopy=()=>useContext(LangContext);

/** The visitor's choice is a per-browser convenience; English when nothing is stored or storage is blocked. */
const storageKey='within-lang';
export function storedLang():Lang{try{const v=localStorage.getItem(storageKey);if(v&&v in copy)return v as Lang}catch{/* storage blocked */}return 'en'}
export function saveLang(lang:Lang){try{localStorage.setItem(storageKey,lang)}catch{/* storage blocked */}}
/** Words before each part, so staggered word animations continue across inline icons. */
export const wordOffsets=(parts:string[],start=0)=>parts.map((_,i)=>start+parts.slice(0,i).join(' ').split(' ').filter(Boolean).length);
