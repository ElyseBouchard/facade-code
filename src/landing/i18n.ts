import {createContext,useContext} from 'react';

/** The site's copy, in plain English. One language: the words are kept simple rather than translated. */
export type Lang='en';
export const languages:{code:Lang;name:string;tag:string}[]=[{code:'en',name:'English',tag:'en'}];

const en={
 docTitle:'Facade — Find what’s behind the wall before renovation',
 menu:{label:'Language',note:''},
 loading:'LOADING',
 hero:{
  title:['FIND UNFORESEEN','CONDITIONS BEFORE','RENOVATION BEGINS.'],titleText:'Find unforeseen conditions before renovation begins.',
  sub:'Facade uses scanning technology to help renovation teams see what’s behind walls and plan their work before demolition.',
  demo:'TRY THE DEMO',savings:'SAVINGS ↗',waitlist:'WAITLIST ↗',linksLabel:'Savings and waitlist',
  legendLabel:'What’s inside the wall',systems:[['M','Heating and air'],['E','Electrical'],['P','Plumbing']],
  hintOpen:'TAKEN APART / DRAG TO TURN',hintClosed:'SCROLL OR DRAG TO TAKE IT APART',
  caption:'SAMPLE WALL / FOR ILLUSTRATION',scroll:'SCROLL',
 },
 inside:{eyebrow:'INSIDE THE WALL / 01',title:['See what’s','inside the wall.'],lede:'Behind the drywall are pipes, wires and air ducts. Scroll down and this sample wall comes apart, one layer at a time.'},
 wall:{
  aria:'A sample wall, opened up: metal studs, an air duct, drain pipes, copper water pipes, an electrical panel with its wiring, and insulation, behind a sheet of drywall. Scroll or drag to take it apart; arrow keys turn it.',
  loading:'LOADING THE WALL',unavailable:'3D VIEW UNAVAILABLE IN THIS BROWSER',failed:'WALL UNAVAILABLE',cursor:'DRAG TO TAKE APART',
  labels:{Drywall:'DRYWALL',Electrical:'WIRING','Water supply':'WATER PIPES','Drain and vent':'DRAIN PIPES',Mechanical:'AIR DUCT',Insulation:'INSULATION',Studs:'METAL STUDS'} as Record<string,string>,
 },
 kit:{
  eyebrow:'THE SCANNER / 02',title:['The scanner,','taken apart.'],
  lede:'A concept for a handheld tool you roll along a wall. It has a heat camera, a metal sensor and a wheel that measures how far it has gone, with room saved for radar.',
  link:'SEE THE HARDWARE ↗',hintOpen:'TAKEN APART',hintClosed:'SCROLL OR DRAG TO TAKE IT APART',caption:'CONCEPT MODEL / NOT FINAL',
  viewer:{
   aria:'The Facade scanner, a concept model: shell and handle, sensor nose, heat camera, controller board, USB ports, space for radar, metal sensor, measuring wheel and screws. Scroll or drag to take it apart; arrow keys turn it.',
   loading:'LOADING THE SCANNER',unavailable:'3D VIEW UNAVAILABLE IN THIS BROWSER',failed:'SCANNER UNAVAILABLE',cursor:'DRAG TO TAKE APART',
   labels:{enclosure:'01 SHELL + HANDLE',cameras:'02 SENSOR NOSE',thermal:'03 HEAT CAMERA',electronics:'04 CONTROLLER BOARD',cables:'05 USB PORTS',radar:'06 SPACE FOR RADAR',metal:'07 METAL SENSOR',tracking:'08 MEASURING WHEEL',fasteners:'09 SCREWS'} as Record<string,string>,
  },
 },
 manifesto:{
  notes:'FIELD NOTES / 01',notesBig:'LOOK. CHECK. DECIDE.',record:['— ALL IN','ONE',' PLACE.'],eyebrow:'HOW IT WORKS',
  s1:{sr:'Good decisions start with what’s really there.',parts:['Good','decisions start with','what’s really there.'],tip:'SEEN ON SITE → PROOF'},
  s2:{sr:'Scan the wall, keep every finding with its proof, and let your team make the call.',parts:['Scan the','wall, keep every finding with its','proof, and let your team make the','call.']},
  body:'Scan walls, check what was found, and compare repair options, all in one place.',
 },
 collage:{
  ticker:'FACADE — ',logLabel:'Sample list of findings',logNote:'FINDINGS — SAMPLE DATA',cursor:'SCAN',
  log:[['OBS-014','AIR UNIT LABEL','field-notes.txt / L12','NOT CHECKED'],['OBS-015','ROOF UNIT AGE','ENGINEER ESTIMATE','CONFIRMED'],['OBS-016','PANEL 2B SIZE','survey.pdf / P4','NOT ENOUGH PROOF'],['OBS-017','DUCT IN WALL','photo-07.jpg','CHECK BY EYE'],['OBS-018','CHILLER SIZE','as-built.pdf / P2','DISPUTED'],['SRC-004','SURVEY TABLE','survey.csv / ROW 18','LINKED'],['OBS-019','BOILER SIZE','UNKNOWN','MISSING']],
  title:['See the building','as it really is.'],essentially:'IN SHORT',
  p1:'A FINDING IS A STARTING POINT. A DOCUMENT IS NOT PROOF. A GUESS IS NOT A MEASUREMENT.',
  p2:'FACADE KEEPS THEM APART, SO YOU ALWAYS KNOW WHAT IS CONFIRMED AND WHAT IS NOT.',
  n1:'01 / SCAN — RECORD WHAT IS BEHIND THE WALL.',n2:'02 / LINK — EVERY FINDING KEEPS ITS PHOTO, FILE AND NOTES.',
  showing:'SHOWING: SAMPLE DATA',n3:['03 / DECIDE — YOUR','ENGINEER',' MAKES THE CALL.'],
 },
 drawings:{zoneA:'ZONE A',zoneB:'ZONE B',coverage:'SAMPLE / AREA SCANNED',cost:'SAMPLE / COSTS',options:['KEEP','UPGRADE','REPLACE'],draft:'FACADE / DRAFT',human:'A PERSON CHECKS',
  aria:['Sample floor plan showing the area scanned','Sample comparison of three repair options','Sample report with its sources']},
 exhibits:{
  heading:'What the software does.',hint:'(DRAG TO MOVE / CLICK TO OPEN)',cursor:'DRAG / OPEN',open:'{title}: open preview. Arrow keys move it.',close:'Close preview',
  opensAt:'OPENS AT →',next:'NEXT:',arrow:'→',illustrative:'SAMPLE /',obj:{setBy:'SET BY ENGINEER',review:'CHECK',draft:'DRAFT',human:'A PERSON CHECKS'},
  items:{
   evidence:{title:'Site findings',label:'RECORD / CHECK',desc:'Write down what was found on site and where. Each finding stays linked to its proof.',detail:'Anything unknown stays marked as unknown, so nothing is filled in by guesswork.',points:['Linked to where it came from','Unknowns stay visible','Sample data in the demo']},
   documents:{title:'Your files',label:'UPLOAD / LINK',desc:'Add spreadsheets, text files and PDFs. Each finding points to the page or row it came from.',detail:'Photos can be attached for a person to look at. The app does not read photos by itself.',points:['Spreadsheets, text and PDF','Page and row links','Photos for people to check']},
   review:{title:'Checking findings',label:'CHECK / HISTORY',desc:'Each finding is marked not checked, confirmed, disputed or not enough proof. Confirming needs a named person.',detail:'Every change is kept, so you can see what changed and why.',points:['Four clear statuses','A name on every confirmation','Full change history']},
   requirements:{title:'What the job needs',label:'SET BY YOUR ENGINEER',desc:'Your engineer sets what the system must do, such as how much cooling is needed.',detail:'Facade does not size equipment or approve designs. Those decisions stay with your engineer.',points:['Set by your engineer','Simple checklist','No automatic sizing']},
   options:{title:'Compare options',label:'KEEP / UPGRADE / REPLACE',desc:'See keep, upgrade and replace side by side: cost, downtime and what is still unknown.',detail:'Missing costs and unchecked options are flagged, so nothing is hidden.',points:['Three options side by side','Downtime limits','Missing details flagged']},
   calculations:{title:'Costs over time',label:'COSTS / HOW IT’S WORKED OUT',desc:'Upfront cost, running cost and future repairs, with every step of the math shown.',detail:'You can change every number. Results are estimates based on what you enter.',points:['Change any number','Math shown in full','Estimates, not promises']},
   report:{title:'Report for the owner',label:'DRAFT / PDF',desc:'Turn checked findings into a draft report with its sources and open questions.',detail:'Your team picks the option to recommend and explains why before it goes in the report.',points:['Your team picks the option','The reason in your words','Sources and open items included']},
   kit:{title:'The scanner',label:'HARDWARE / CONCEPT',desc:'A handheld scanner with a heat camera, a metal sensor, space for radar and a measuring wheel.',detail:'A concept model. Not final, and not connected to real hardware yet.',points:['Whole and taken apart','Every part labelled','Concept only']},
  },
 },
 savings:{eyebrow:'TIME BACK',title:['Less paperwork.','More time to build.'],body:'See what fewer hours of sorting notes and writing reports could be worth to your team.',action:'WORK OUT YOUR SAVINGS',note:'CHANGE ANY NUMBER. ESTIMATES, NOT PROMISES.',art:'TIME / VALUE'},
 questions:{
  title:['Good','to know.'],intro:'SIMPLE ANSWERS TO COMMON QUESTIONS:',
  items:[
   ['does Facade design the system for me?','No. Your engineer decides what the building needs and which options make sense. Facade organises the evidence and compares the costs you enter.'],
   ['what can I add to a project?','Spreadsheets, text files and PDFs. Every finding stays linked to the file and page it came from. Photos can be added for a person to look at.'],
   ['what if some information is missing?','It stays marked as missing. You can add an estimate with a reason, and Facade shows anything the comparison still needs.'],
   ['where is my data kept?','In your own browser, on this device. No account is needed. Clearing your browser data deletes it.'],
   ['can I share the results?','Yes. Pick the option you recommend, explain why, and download a draft PDF report with its sources and open questions.'],
  ],
 },
 projects:{eyebrow:'SAVED ON THIS DEVICE',title:'Your projects.',note:'',demo:'SAMPLE',local:'YOUR PROJECT',empty:'NO PROJECTS YET',emptyBody:''},
 join:{eyebrow:'WHAT’S NEXT',title:['Be first','to try Facade.'],action:'JOIN THE WAITLIST'},
 footer:{
  tagline:'SEE BEHIND THE WALL BEFORE YOU OPEN IT.',judgment:'YOUR ENGINEER MAKES THE CALL.',top:'TOP',cont:['MORE','HERE:'],navLabel:'Footer',pills:['SAVINGS','WAITLIST','HARDWARE'],
  note:'Facade is in development. The scanner is a concept model and the demo uses sample data. Savings are estimates based on numbers you can change.',
 },
 costs:{eyebrow:'THE NUMBERS / 03',title:['What surprises','cost.'],lede:'On a $1M renovation, surprises add about $35,600. The biggest part comes from things nobody could see.',rows:['Hidden problems','Design changes','Owner changes'],short:['HIDDEN','DESIGN','OWNER'],total:'Total extra',scenarios:['Found during the work','1 in 3 found before'],modesLabel:'Compare',replay:'PLAY AGAIN',savingsTag:'EXAMPLE',savingsLine:'saved if a third of the hidden problems are found before work starts.',net:'Before the cost of scanning and checking.',source:'Based on a 2018 study of 161 school renovations, scaled to $1M. Estimates, not quotes.',sourceLink:'STUDY ↗',calc:'WORK OUT YOUR OWN ↗',savedShort:'SAVED',legend:'1 LINE = $1,000',aria:'A renovation site drawn in lines. Red lines, one per $1,000, rise from where each surprise comes from: $14,500 hidden problems, $13,600 design changes, $7,500 owner changes. Finding a third of the hidden problems early removes 5 lines, or $5,000.',loading:'LOADING THE SITE',failed:'SITE UNAVAILABLE',unavailable:'3D VIEW UNAVAILABLE IN THIS BROWSER',cursor:'DRAG TO LOOK AROUND'},
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
