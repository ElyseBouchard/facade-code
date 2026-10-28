import {createContext,useContext} from 'react';

/** The site's copy, in plain English. One language: the words are kept simple rather than translated. */
export type Lang='en';
export const languages:{code:Lang;name:string;tag:string}[]=[{code:'en',name:'English',tag:'en'}];

const en={
 hero:{
  legendLabel:'What’s inside the wall',systems:[['M','Heating and air'],['E','Electrical'],['P','Plumbing']],
  hintOpen:'Taken apart / drag to turn',hintClosed:'Scroll or drag to take it apart',caption:'Sample wall / for illustration',
 },
 inside:{eyebrow:'Inside the wall / 01',title:['See what’s','inside the wall.'],lede:'Behind the drywall are pipes, wires and air ducts. Scroll down and this sample wall comes apart, one layer at a time.'},
 wall:{
  aria:'A sample wall, opened up: metal studs, an air duct, drain pipes, copper water pipes, an electrical panel with its wiring, and insulation, behind a sheet of drywall. Scroll or drag to take it apart; arrow keys turn it.',
  loading:'Loading the wall',unavailable:'3D view unavailable in this browser',failed:'Wall unavailable',
  labels:{Drywall:'DRYWALL',Electrical:'WIRING','Water supply':'WATER PIPES','Drain and vent':'DRAIN PIPES',Mechanical:'AIR DUCT',Insulation:'INSULATION',Studs:'METAL STUDS'} as Record<string,string>,
 },
 kit:{
  eyebrow:'The scanner / 02',title:['The scanner,','taken apart.'],
  lede:'A handheld tool you roll along a wall. It has a heat camera, a metal sensor and a wheel that measures how far it has gone, with room saved for radar.',
  link:'See the hardware',hintOpen:'Taken apart',hintClosed:'Scroll or drag to take it apart',caption:'Concept model / not final',
  viewer:{
   aria:'The Facade scanner, a concept model: shell and handle, sensor nose, heat camera, controller board, USB ports, space for radar, metal sensor, measuring wheel and screws. Scroll or drag to take it apart; arrow keys turn it.',
   loading:'Loading the scanner',unavailable:'3D view unavailable in this browser',failed:'Scanner unavailable',
   labels:{enclosure:'01 SHELL + HANDLE',cameras:'02 SENSOR NOSE',thermal:'03 HEAT CAMERA',electronics:'04 CONTROLLER BOARD',cables:'05 USB PORTS',radar:'06 SPACE FOR RADAR',metal:'07 METAL SENSOR',tracking:'08 MEASURING WHEEL',fasteners:'09 SCREWS'} as Record<string,string>,
  },
 },
 costs:{eyebrow:'The numbers / 03',title:['What surprises','cost.'],lede:'On a $1M renovation, surprises add about $35,600. The biggest part comes from things nobody could see.',rows:['Hidden problems','Design changes','Owner changes'],short:['HIDDEN','DESIGN','OWNER'],total:'Total extra',scenarios:['Found during the work','1 in 3 found before'],modesLabel:'Compare',replay:'Play again',savingsTag:'Example',savingsLine:'saved if a third of the hidden problems are found before work starts.',net:'Before the cost of scanning and checking.',source:'Based on a 2018 study of 161 school renovations, scaled to $1M. Estimates, not quotes.',sourceLink:'Read the study',calc:'Work out your own',savedShort:'SAVED',legend:'1 line = $1,000',aria:'A renovation site drawn in lines. Red lines, one per $1,000, rise from where each surprise comes from: $14,500 hidden problems, $13,600 design changes, $7,500 owner changes. Finding a third of the hidden problems early removes 5 lines, or $5,000.',loading:'Loading the site',failed:'Site unavailable',unavailable:'3D view unavailable in this browser'},
 how:{
  eyebrow:'How it works / 04',title:'Good decisions start with what’s really there.',
  lede:'Scan the wall, keep every finding with its proof, and let your team make the call.',
  steps:[
   ['Scan','Record what is behind the wall, bay by bay. Each reading is a lead for a person to confirm, not a finished survey.'],
   ['Link','Every finding keeps the photo, file or note it came from, so anyone can check where it started.'],
   ['Decide','Your engineer makes the call. Compare keep, upgrade and replace using the costs you enter.'],
  ],
  log:{title:'Findings log',sample:'Sample data',columns:['ID','Finding','Source','Status'],
   rows:[['OBS-014','Air unit label','field-notes.txt, line 12','Not checked','open'],['OBS-015','Roof unit age','Engineer estimate','Confirmed','done'],['OBS-016','Panel 2B size','survey.pdf, page 4','Not enough proof','flag'],['OBS-017','Duct in wall','photo-07.jpg','Check by eye','open'],['OBS-018','Chiller size','as-built.pdf, page 2','Disputed','flag'],['SRC-004','Survey table','survey.csv, row 18','Linked','done'],['OBS-019','Boiler size','Unknown','Missing','flag']] as [string,string,string,string,'open'|'done'|'flag'][]},
  note:'A finding is a starting point. A document is not proof. A guess is not a measurement. Facade keeps them apart, so you always know what is confirmed and what is not.',
 },
 exhibits:{
  eyebrow:'The software / 05',heading:'What the software does.',lede:'Eight parts of one workspace. Open any of them for the detail, or try them in the demo.',
  open:'{title}: open details',close:'Close details',demo:'Try it in the demo',next:'Next:',illustrative:'Illustration /',
  obj:{setBy:'SET BY ENGINEER',review:'CHECK',draft:'DRAFT',human:'A PERSON CHECKS'},
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
 questions:{
  eyebrow:'Questions / 06',title:'Good to know.',lede:'Simple answers to common questions.',
  items:[
   ['Does Facade design the system for me?','No. Your engineer decides what the building needs and which options make sense. Facade organises the evidence and compares the costs you enter.'],
   ['What can I add to a project?','Spreadsheets, text files and PDFs. Every finding stays linked to the file and page it came from. Photos can be added for a person to look at.'],
   ['What if some information is missing?','It stays marked as missing. You can add an estimate with a reason, and Facade shows anything the comparison still needs.'],
   ['Where is my data kept?','In your own browser, on this device. No account is needed. Clearing your browser data deletes it.'],
   ['Can I share the results?','Yes. Pick the option you recommend, explain why, and download a draft PDF report with its sources and open questions.'],
  ],
 },
 join:{eyebrow:'Waitlist / 07',title:['Be first','to try Facade.'],lede:'Leave your email and we’ll send early-access updates as the scanner and software develop.',action:'Join the waitlist'},
};
export type Copy=typeof en;

export const copy:Record<Lang,Copy>={en};
type LangState={lang:Lang;t:Copy;setLang:(lang:Lang)=>void};
const LangContext=createContext<LangState>({lang:'en',t:en,setLang:()=>{}});
export const LangProvider=LangContext.Provider;
export const useCopy=()=>useContext(LangContext);
