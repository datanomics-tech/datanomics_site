// Site content. Edit text here, then run `npm run build`.
const DIVS = [
  {id:"A", name:"Creative & Digital Experience", d:"How people see, hear and experience your organisation."},
  {id:"B", name:"Software, Data & Intelligence", d:"The systems and insight that run your business day to day."},
  {id:"C", name:"Infrastructure & Managed Services", d:"The equipment and networks everything else depends on."},
  {id:"D", name:"Training & Technology Enablement", d:"The skills that help your people use technology with confidence."}
];

const VERTICALS = [
  {id:"branding", no:"01", div:"A", icon:"i-pen", nm:"Branding & Design", title:"Branding, Creative Design & Digital Identity",
   short:"Give your organisation a face people remember: logo, colours, voice and the templates your team uses every day.",
   intro:"Your brand is what people meet before they meet you. We help you show up consistently, from the sign at your door to your WhatsApp Business profile.",
   solutions:["Logo and visual identity design","Brand guidelines and tone of voice","Company profiles and pitch documents","Stationery, signage and merchandise artwork","Social media templates","Brand refresh for established organisations"],
   customers:["Start-ups and SMEs","Construction and engineering firms","Schools","NGOs","Hospitality"],
   deliverables:["Logo files in every format you need","A brand guide your team can actually follow","Editable templates for letters, slides and posts","Print-ready artwork"],
   tech:["Figma","Adobe Illustrator","Adobe InDesign","Canva templates"]},
  {id:"marketing", no:"02", div:"A", icon:"i-mega", nm:"Digital Marketing", title:"Digital Marketing & Customer Experience",
   short:"Reach the right people online and make every interaction, from first click to after-sales, feel easy.",
   intro:"Good marketing starts with understanding who your customers are and what they need. We help you find them, speak to them clearly and measure what works.",
   solutions:["Social media strategy and management","Search engine optimisation (SEO)","Google and Meta ad campaigns","Email and WhatsApp customer journeys","Customer feedback and satisfaction surveys","Analytics and monthly reporting"],
   customers:["Retail and e-commerce","Hospitality and tourism","Professional services","Financial institutions"],
   deliverables:["A 90-day marketing plan","Content calendar","Campaign dashboards","A monthly report in plain language"],
   tech:["Google Analytics 4","Meta Business Suite","Mailchimp / Brevo","Google Search Console","Looker Studio"],
   note:"Paid advertising is booked directly on the platforms or through licensed media partners."},
  {id:"media", no:"03", div:"A", icon:"i-play", nm:"Media & Content", title:"Media, Content & Corporate Communication",
   short:"Clear, honest content that tells your story: articles, reports, photos, video and internal communication.",
   intro:"People trust organisations that explain themselves well. We help you put your work into words and pictures, whether it is an annual report, a product video or a message to your staff.",
   solutions:["Company profiles and annual report design","Website and blog content writing","Photo and short video production","Infographics and data storytelling","Internal newsletters and announcements","Press releases and event coverage"],
   customers:["Corporates and banks","NGOs and development partners","Government institutions","Schools and universities"],
   deliverables:["Edited articles and copy","Designed reports and infographics","Social-ready video clips","A content style guide"],
   tech:["Adobe Premiere Pro","After Effects","Photoshop","InDesign","Canva"],
   note:"Larger video and broadcast productions are delivered with trusted local media partners."},
  {id:"software", no:"04", div:"B", icon:"i-code", nm:"Software & Platforms", title:"Software & Digital Platforms",
   short:"Web and mobile applications built around how your people actually work, secure from the first line of code.",
   intro:"The best software feels obvious to the person using it. We sit with your team, watch how work really happens and build web, Android and iOS tools that make their day easier.",
   solutions:["Web applications and customer portals","Android and iOS apps","SaaS platforms","API and mobile money integrations","Websites and portfolios with managed hosting","UI/UX design and prototyping"],
   customers:["Start-ups","Financial institutions","Logistics companies","Schools","Public institutions"],
   deliverables:["A clickable prototype before we build","Source code you own","Automated tests and security scan reports","User and admin guides"],
   tech:["React","Next.js","Flutter","Kotlin","Python / FastAPI",".NET","PostgreSQL","Docker"]},
  {id:"erp", no:"05", div:"B", icon:"i-grid", nm:"ERP Systems", title:"ERP & Enterprise Business Applications",
   short:"Bring procurement, stock, HR and finance into one system so everyone works from the same numbers.",
   intro:"When every department keeps its own spreadsheet, nobody trusts the totals. We design and roll out business systems that connect your processes, with approvals and audit trails built in.",
   solutions:["Procurement and purchase order workflows","Inventory and warehouse management","HR, payroll and leave","Finance and accounting integration","Project and contract management","Management reporting and dashboards"],
   customers:["Construction companies","Manufacturing and distribution","Hospitality groups","NGOs and projects"],
   deliverables:["Maps of how work flows today and tomorrow","A configured system with your data migrated","Role-based access and approvals","Staff training and go-live support"],
   tech:["Odoo","ERPNext","Django",".NET","PostgreSQL","Power BI"]},
  {id:"cloud-cyber", no:"06", div:"B", icon:"i-shield", nm:"Cloud & Cyber", title:"Cloud, Cybersecurity & Data Intelligence",
   short:"Protect your systems and data, move to the cloud safely and turn your records into decisions.",
   intro:"Security should let you sleep at night, not slow you down. Our engineers test your systems the way attackers would, fix what matters most first and help you use your data with confidence.",
   solutions:["Vulnerability assessment and penetration testing","Security audits and policy writing","SOC monitoring and incident response","Security awareness training for staff","Cloud migration and hardening","Data analytics, BI and predictive models"],
   customers:["Banks and microfinance","Insurance","Government institutions","Health and education","Any business holding personal data"],
   deliverables:["A prioritised report with fixes your developers can follow","Free retest of critical issues","Security policies aligned with ISO 27001","Dashboards and data pipelines"],
   tech:["Burp Suite","Nessus / Tenable","Wazuh","SIEM platforms","AWS / Azure","Python","Power BI"],
   note:"We work in line with Rwanda's data protection law (N° 058/2021) and your sector's regulations."},
  {id:"connectivity", no:"07", div:"C", icon:"i-wifi", nm:"Connectivity", title:"IT Infrastructure & Network Connectivity",
   short:"Fast, reliable networks for offices, campuses and sites, from structured cabling to Wi-Fi that reaches every room.",
   intro:"Nothing frustrates a team more than a network that keeps dropping. We plan, cable, configure and monitor networks so they just work, including CCTV backbones and connectivity for construction sites.",
   solutions:["Structured cabling and fibre","Enterprise Wi-Fi design and installation","Firewalls, VPN and secure remote access","Server rooms and rack builds","Networks for CCTV and access control","Network monitoring and maintenance"],
   customers:["Offices and head offices","Construction sites","Schools and campuses","Hotels"],
   deliverables:["Site survey and network design","A labelled, tested installation","As-built documentation","Monitoring and support plan"],
   tech:["Cisco","MikroTik","Ubiquiti","Fortinet","Fluke testing"],
   note:"Internet and telecom services come from RURA-licensed operators. We design, install and look after the network on your side."},
  {id:"it-supply", no:"08", div:"C", icon:"i-server", nm:"IT Supply", title:"Hardware, IT Equipment Supply & Installation",
   short:"Genuine laptops, servers, networking gear and CCTV equipment, sourced, set up and maintained for you.",
   intro:"Buying equipment is easy. Buying the right equipment at a fair price, with a warranty and someone to install it, is harder. We handle all of it so your team can start working on day one.",
   solutions:["Laptops, desktops and printers","Servers and storage","Networking equipment","CCTV cameras, NVRs and access control hardware","UPS and power protection","Installation, setup and preventive maintenance"],
   customers:["SMEs and offices","Schools","Construction companies","Government institutions"],
   deliverables:["A clear quotation in RWF","Configured, labelled devices","An asset register with warranty dates","A maintenance schedule"],
   tech:["Dell","HP","Lenovo","Hikvision","Dahua","APC"]},
  {id:"integration", no:"09", div:"C", icon:"i-link", nm:"Systems Integration", title:"Systems Integration, IT Consulting & Managed Services",
   short:"Make your systems talk to each other, and let us look after them so your team can focus on its work.",
   intro:"Most organisations already own good tools. They just don't work together. We connect them, document them and look after them under a simple service agreement.",
   solutions:["System and API integration","IT audits and technology advice","Managed IT support, remote and on-site","Backup and disaster recovery","Microsoft 365 and Google Workspace administration","Repair and maintenance of computers and equipment"],
   customers:["SMEs without an in-house IT team","Growing organisations","NGOs and projects","Schools"],
   deliverables:["An integration map","A service agreement with response times","A monthly health report","A named engineer as your contact"],
   tech:["Microsoft 365","Google Workspace","Active Directory","Veeam","REST APIs","n8n"]},
  {id:"ai-automation", no:"10", div:"B", icon:"i-ai", nm:"AI & Smart Automation", title:"AI, Smart Automation & Intelligent Operations",
   short:"Automate repetitive work and secure your spaces with CCTV, access control and smart home and office automation.",
   intro:"Automation should give people their time back. We use AI where it genuinely helps, and smart devices that make offices and homes safer, more comfortable and cheaper to run.",
   solutions:["CCTV installation and remote monitoring","Access control and visitor management","Smart home and office automation","Workflow automation and AI assistants","Document processing and chatbots","Forecasting and predictive maintenance"],
   customers:["Offices and homes","Hotels and apartments","Banks","Warehouses and construction sites"],
   deliverables:["A security and automation survey","An installed, tested system with mobile access","Documented automated workflows","Hands-on user training"],
   tech:["Hikvision","Dahua","ZKTeco","Home Assistant","Python","LLM APIs","n8n"]},
  {id:"training", no:"11", div:"D", icon:"i-cap", nm:"ICT Training", title:"ICT Training, Digital Skills & Certifications",
   short:"Practical workshops that build digital confidence, from everyday tools to cybersecurity and data skills.",
   intro:"Technology only works when people feel confident using it. Our trainers teach in plain language, in English or Kinyarwanda, with hands-on exercises drawn from your own work.",
   solutions:["Cybersecurity awareness for staff","Microsoft 365 and Google Workspace skills","Data analysis with Excel and Power BI","Programming and web development bootcamps","IT support skills for in-house teams","Certification preparation"],
   customers:["Companies and their staff","Schools and universities","Youth and women's programmes","Public institutions"],
   deliverables:["A training needs assessment","Course materials to keep","Practical exercises and assessments","Attendance certificates"],
   tech:["Microsoft 365","Power BI","Python","Cisco Packet Tracer","Linux security labs"],
   note:"Accredited certifications are prepared and delivered with authorised training partners."},
  {id:"transformation", no:"12", div:"B", icon:"i-compass", nm:"Digital Transformation", title:"Digital Transformation & Technology Strategy",
   short:"A clear, realistic roadmap for using technology to serve your customers better and run more efficiently.",
   intro:"Transformation is not one big launch. It is a series of sensible steps. We help leaders decide what to digitise first, what it will cost and how to bring their people along.",
   solutions:["Digital maturity assessment","Technology strategy and roadmap","Process digitisation and the paperless office","Vendor selection and procurement advice","Project and change management","Data governance and policies"],
   customers:["Executive teams and boards","Government institutions","Family businesses ready to grow","NGOs and programmes"],
   deliverables:["A current-state assessment","A prioritised 12–24 month roadmap","Budget and business case","Quarterly progress reviews"],
   tech:["BPMN process mapping","Power BI","Microsoft Project","Jira"]}
];
const VMAP = Object.fromEntries(VERTICALS.map(v => [v.id, v]));

const INDUSTRIES = [
  {icon:"i-users", t:"Businesses & SMEs", d:"All-in-one IT support so you can grow without building a full IT department.", v:["08","09","04","02"]},
  {icon:"i-hardhat", t:"Construction companies", d:"Site networks, CCTV, procurement systems and progress dashboards that keep projects on track.", v:["07","10","05","08"]},
  {icon:"i-cap", t:"Schools & universities", d:"Reliable campus Wi-Fi, computer labs, learning platforms and digital skills for staff and students.", v:["07","08","11","04"]},
  {icon:"i-bank", t:"Financial institutions", d:"Security testing, monitoring and secure digital channels that meet regulators' expectations.", v:["06","04","05","12"]},
  {icon:"i-hotel", t:"Hospitality operators", d:"Guest Wi-Fi, smart rooms, CCTV and marketing that brings guests back.", v:["10","07","02","01"]},
  {icon:"i-gov", t:"Government & public institutions", d:"Strategy, secure systems and clear public communication for better services to citizens.", v:["12","06","03","11"]}
];

const WHY = [
  ["i-users","You talk to engineers, not salespeople","The person who scopes your project is part of the team that builds it, so nothing gets lost in translation."],
  ["i-lock","Security is built in from day one","We think about how a system could be misused before we build it, not after something goes wrong."],
  ["i-bulb","Plain language, always","No jargon in our proposals or reports. If something is unclear, we explain it again, in English or Kinyarwanda."],
  ["i-headset","We stay after launch","Training, handover and support come from the same people you already know."],
  ["i-layers","Built to grow with you","Start with one vertical and add others when you need them, without starting over."],
  ["i-globe","Local roots, international standards","A Kigali team working to the same standards as international firms."]
];

const VALUES = [
  ["i-bulb","Innovation","We look for the simplest modern solution that solves the real problem."],
  ["i-scale","Integrity","Honest advice, transparent pricing and no surprises in the invoice."],
  ["i-clock","Reliability","We do what we say, when we say, and document how we did it."],
  ["i-shield","Security","We protect client data and systems as carefully as our own."],
  ["i-gem","Excellence","Clean code, tidy cabling and reports that hold up to scrutiny."],
  ["i-heart","Client-Centricity","Your goals set the scope. We measure success by your outcomes."]
];

const CMP = [
  ["Hardware, software and security under one contract", true, false],
  ["In-house penetration testing and SOC capability", true, false],
  ["Data science and AI delivered alongside systems", true, false],
  ["On-site engineers in Kigali", true, true],
  ["Documentation and knowledge transfer included", true, false],
  ["Post-launch support with agreed response times", true, "partial"]
];

const PROJECTS = [
  {t:"RIDIP: Rwanda Integrated Data Intelligence Platform", cat:"Data & AI", live:true, tags:["Data science","Public sector","Open data"],
   stack:"React · FastAPI · PostgreSQL/PostGIS · Leaflet",
   d:"Built for the NISR 2026 Big Data Hackathon. Brings 39 official indicators for all 30 districts together, ranks relative need by sector and produces rules-based priority briefs for planners.",
   long:"RIDIP compares every district with the national figure, explains which indicators drive each need score, runs leave-one-out sensitivity analysis and groups similar districts with k-means clustering. Data comes from EICV7, FinScope 2024, the Seasonal Agricultural Survey 2025, the Labour Force Survey and the Rwanda DHS 2025.",
   url:"https://ridip.onrender.com", c:["#0D6EFD","#00C853"], ic:"i-data"},
  {t:"Smart Office Security System", cat:"Security & CCTV", tags:["CCTV","Access control","Automation"],
   stack:"IP cameras · NVR · RFID access · PoE switching",
   d:"Integrated surveillance, door access and lighting automation for a multi-floor office, viewable from one mobile app.",
   long:"A typical engagement: a site survey to map coverage, IP cameras with 30-day retention, badge-controlled doors with audit logs, and automated lighting schedules that cut after-hours energy use.",
   c:["#0A3A7A","#00C853"], ic:"i-cctv"},
  {t:"AI Analytics Dashboard", cat:"Data & AI", tags:["Business intelligence","Forecasting"],
   stack:"Python · PostgreSQL · scikit-learn · Apache Superset",
   d:"Sales and operations data unified into one dashboard with demand forecasts and automated weekly reports.",
   long:"Pipelines pull from accounting, POS and spreadsheets each night; a forecasting model flags expected stock-outs; managers receive a one-page PDF every Monday.",
   c:["#0D6EFD","#7C4DFF"], ic:"i-ai"},
  {t:"Enterprise ERP Platform", cat:"Software", tags:["ERP","Workflow","Integrations"],
   stack:"Django · React · PostgreSQL · Docker",
   d:"Procurement, inventory, HR and finance modules on one platform with role-based approvals.",
   long:"Purchase requests, approvals, purchase orders and stock movements in a single audited workflow, integrated with existing accounting and email systems.",
   c:["#0F172A","#0D6EFD"], ic:"i-layers"},
  {t:"Mobile Banking App", cat:"Software", tags:["Fintech","Android","iOS"],
   stack:"Flutter · Kotlin · REST APIs · Biometric auth",
   d:"Account access, transfers and mobile money top-ups in a secure cross-platform app.",
   long:"Biometric login, device binding, certificate pinning and transaction signing, with penetration testing before every major release.",
   c:["#00A3FF","#00C853"], ic:"i-mobile"},
  {t:"Corporate Website Suite", cat:"Web", tags:["Websites","SEO","CMS"],
   stack:"Next.js · Headless CMS · CDN hosting",
   d:"A family of fast, bilingual corporate sites managed from one content platform.",
   long:"Shared design system, Kinyarwanda and English content, image optimisation for mobile networks and monthly SEO reporting.",
   c:["#7C4DFF","#0D6EFD"], ic:"i-web"},
  {t:"CCTV Infrastructure Project", cat:"Security & CCTV", tags:["Surveillance","Networking"],
   stack:"4K IP cameras · Fibre backbone · Central NVR",
   d:"Campus-wide surveillance with a fibre backbone, central recording and 24/7 monitoring room.",
   long:"Ring fibre for resilience, UPS-backed recording, tiered access for guards and management, and quarterly health checks.",
   c:["#00C853","#0A3A7A"], ic:"i-server"}
];

const TEAM = [
  {n:"Frank Shimirwa Muyoboke", r:"Managing Director", lead:true,
   b:"Frank founded DATANOMICS TECHNOLOGIES Ltd to give Rwandan organisations a single, accountable partner for data, security and infrastructure. He leads strategy, client relationships and delivery quality across every practice."},
  {n:"Eric N.", r:"Cybersecurity Engineer", ph:true, b:"Runs penetration tests and security audits, and turns findings into practical remediation plans."},
  {n:"Diane M.", r:"Data Scientist", ph:true, b:"Builds forecasting models and dashboards that turn operational data into decisions."},
  {n:"Patrick H.", r:"Full Stack Developer", ph:true, b:"Designs and ships web platforms and APIs with security testing in the pipeline."},
  {n:"Olivier T.", r:"Systems Engineer", ph:true, b:"Plans networks, servers and CCTV installations, and keeps them running."},
  {n:"Josiane K.", r:"UI/UX Designer", ph:true, b:"Shapes interfaces that are clear, accessible and fast on any device."}
];

const TST = [
  {q:"Their penetration test found issues two previous audits had missed, and the report told our developers exactly what to fix. The retest closed everything within a month.", n:"Head of IT", c:"Microfinance institution, Kigali", s:5},
  {q:"We went from monthly spreadsheets to a live dashboard our directors actually open. Forecasts are now part of every planning meeting.", n:"Operations Director", c:"Logistics company, Kigali", s:5},
  {q:"The CCTV and access control rollout was finished on schedule across three sites. Remote viewing has changed how we manage after-hours security.", n:"Facilities Manager", c:"Hospitality group, Rwanda", s:5},
  {q:"Clear proposal, fair pricing in RWF and a team that answers the phone. Our new website loads fast even on mobile data.", n:"Managing Partner", c:"Professional services firm", s:5},
  {q:"They supplied and configured all our laptops and network equipment, then trained our staff. Handover documentation was excellent.", n:"Administration Lead", c:"Private school, Kigali", s:4},
  {q:"A practical partner for our data project. They explained methods in plain language, which mattered for our board.", n:"Programme Manager", c:"NGO, East Africa", s:5}
];

const POSTS = [
  {t:"Digital transformation in Africa: where the next decade of value sits", cat:"Digital Transformation", date:"28 Oct 2026", min:7, feat:true,
   x:"Mobile money proved Africa can leapfrog. The next wave is about data, automation and trusted digital services inside every organisation.",
   f:["Rwanda's investment in connectivity and e-government has created a base few countries of its size can match. The opportunity now is inside organisations: digitising approvals, connecting data that sits in separate systems and automating repetitive work.","We see the fastest returns where leaders start small, with one process that hurts, measure the result and then scale. Transformation is a series of well-run projects, not a single big launch."], c:["#0D6EFD","#00C853"], ic:"i-globe"},
  {t:"Cybersecurity trends East African organisations should plan for in 2027", cat:"Cybersecurity", date:"21 Oct 2026", min:6,
   x:"AI-assisted phishing, attacks on mobile money flows and supply-chain compromises top our watch-list for the year ahead.",
   f:["Phishing emails written by AI are now fluent in English, French and Kinyarwanda, which removes one of the easiest warning signs. Awareness training needs to focus on verifying requests rather than spotting typos.","Third-party access is the other gap we see most often. Review which vendors hold VPN or admin access, enforce MFA everywhere and log what they do."], c:["#0A3A7A","#0D6EFD"], ic:"i-shield"},
  {t:"From spreadsheets to predictions: a practical path into AI and Big Data", cat:"Data & AI", date:"14 Oct 2026", min:5,
   x:"You do not need a data lake to start. You need clean data, one clear question and a dashboard people trust.",
   f:["Start by fixing the data you already have: consistent names, dates and IDs. Then automate the report your managers build by hand each month. Forecasting comes after, once the foundations are stable."], c:["#7C4DFF","#0D6EFD"], ic:"i-ai"},
  {t:"Smart office automation that pays for itself", cat:"Automation", date:"07 Oct 2026", min:4,
   x:"Lighting schedules, occupancy sensors and access control can cut energy bills and tighten security in the same project.",
   f:["The quickest wins are lights and air conditioning that switch off after hours, and door access that leaves an audit trail. Most offices recover the cost within two to three years."], c:["#00C853","#0A3A7A"], ic:"i-cctv"},
  {t:"Cloud, hybrid or on-premise? Choosing infrastructure in Rwanda", cat:"Cloud", date:"30 Sep 2026", min:6,
   x:"Latency, data residency and total cost all shift the answer. Here is how we help clients decide.",
   f:["Local hosting can make sense for regulated data and low latency; public cloud wins for elastic workloads and global reach. Many clients end up hybrid, with clear rules for which data lives where."], c:["#00A3FF","#0F172A"], ic:"i-cloud"},
  {t:"Rwanda's data protection law: what your business must do now", cat:"Data Privacy", date:"23 Sep 2026", min:5,
   x:"Law N° 058/2021 sets clear duties for anyone processing personal data. A short checklist for compliance.",
   f:["Know what personal data you hold and why, register with the supervisory authority where required, secure the data with appropriate controls and have a process for breach notification and data-subject requests.","This article is general guidance, not legal advice. Speak to a qualified lawyer about your specific obligations."], c:["#0D6EFD","#7C4DFF"], ic:"i-lock"}
];

export { DIVS, VERTICALS, VMAP, INDUSTRIES, WHY, VALUES, CMP, PROJECTS, TEAM, TST, POSTS };
