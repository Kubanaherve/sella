/**
 * SELLA - Master Translation Catalogue Data
 * Comprehensive Inventory of all user-visible strings, UI elements, and generated documents.
 * 
 * Columns:
 * - id: Unique identifier (e.g. AUTH-001)
 * - module: Module or page location
 * - element: Type of UI element (Button, Title, Label, Placeholder, Toast, etc.)
 * - en: Exact English text
 * - rwCurrent: Current Kinyarwanda text rendered or stored in Sella
 * - rwSuggested: Expert recommended Kinyarwanda translation
 * - rwFinal: MUST BE EMPTY STRING for user entry
 * - status: 'Correct' | 'Needs correction' | 'Missing translation' | 'Inconsistent terminology' | 'Source-only / Not visually verified'
 * - notes: Contextual explanation
 */

export const terminologyGlossary = [
  {
    termEn: "Debt / Credit",
    termRwCurrent: "Ideni",
    termRwSuggested: "Ideni (Amadeni)",
    context: "Money owed by customers who took goods on credit. In Rwandan retail, 'Ideni' is universally understood.",
    status: "Correct",
    notes: "Used consistently for customer debt. In contrast, 'Inguzanyo' refers to bank/formal loans, so 'Ideni' is the correct retail term."
  },
  {
    termEn: "Total Debt / Total Unpaid",
    termRwCurrent: "Ideni ryose / Ideni ritarishyurwa / Amafaranga yose y'amadeni",
    termRwSuggested: "Amadeni yose atarishyurwa",
    context: "Aggregate unpaid customer balances across all debtors displayed on Dashboard, Debts page, and Reports.",
    status: "Inconsistent terminology",
    notes: "Currently 3 different terms are used across Dashboard, Debts, and PDF headers. Standardizing to 'Amadeni yose atarishyurwa' eliminates ambiguity."
  },
  {
    termEn: "Average Debt / Average Balance",
    termRwCurrent: "Ideni risanzwe",
    termRwSuggested: "Ideni rigereranyije",
    context: "Statistical calculation of total unpaid debt divided by number of debtors in PDF Debtor Statement.",
    status: "Needs correction",
    notes: "'Ideni risanzwe' literally translates to 'ordinary debt' or 'regular debt', which is completely incorrect for mathematical average. Standard Kinyarwanda is 'Ideni rigereranyije'."
  },
  {
    termEn: "Debtors / Customers with Debt",
    termRwCurrent: "Abadenyi / Abafite ideni",
    termRwSuggested: "Abafite amadeni",
    context: "Customers with an outstanding balance. In Rwandan retail culture, 'Abadenyi' has a derogatory/pejorative undertone.",
    status: "Needs correction",
    notes: "Calling customers 'Abadenyi' in formal PDF statements is disrespectful in business. 'Abafite amadeni' is respectful, standard, and professional."
  },
  {
    termEn: "Print / Printing",
    termRwCurrent: "Printinga",
    termRwSuggested: "Gucapa / Gukora print",
    context: "Action button to trigger thermal printer or browser print dialog.",
    status: "Needs correction",
    notes: "'Printinga' is an informal English loanword. The proper formal Kinyarwanda word is 'Gucapa'. In tech UI, 'Gucapa resi' or 'Gucapa' is standard."
  },
  {
    termEn: "Receipt",
    termRwCurrent: "Resi / Inyemezabwishyu",
    termRwSuggested: "Resi / Inyemezabwishyu",
    context: "Document acknowledging receipt of money/payment.",
    status: "Correct",
    notes: "'Resi' is widely used and understood by shopkeepers. 'Inyemezabwishyu' is formal Kinyarwanda. Both are acceptable; 'Resi' fits compact screens best."
  },
  {
    termEn: "Invoice",
    termRwCurrent: "Fakitire",
    termRwSuggested: "Fakitire",
    context: "Itemized commercial bill requested before or during payment.",
    status: "Correct",
    notes: "Universal loanword from French 'facture', standard in Rwanda for commercial invoices."
  },
  {
    termEn: "Cart / Basket",
    termRwCurrent: "Agatebo",
    termRwSuggested: "Ibyatoranyijwe / Agatebo",
    context: "Temporary list of items picked for the current sale order.",
    status: "Needs correction",
    notes: "'Agatebo' literally means 'small woven basket'. While cute, in modern digital POS 'Ibyatoranyijwe' (Selected items) or 'Ibicuruzwa bitoranyijwe' is more accurate for hardware/jewelry/clothing stores."
  },
  {
    termEn: "Balance Due / Remaining Debt",
    termRwCurrent: "Asigaye / ideni",
    termRwSuggested: "Asigaye ku ideni",
    context: "Remaining unpaid amount on a partial sale or debt payment.",
    status: "Inconsistent terminology",
    notes: "The slash 'Asigaye / ideni' creates confusion between change due and debt. Standardizing to 'Asigaye kwishyurwa' or 'Asigaye ku ideni' is clearer."
  },
  {
    termEn: "Change Due",
    termRwCurrent: "Amafaranga yo gusubiza",
    termRwSuggested: "Amafaranga yo gusubiza",
    context: "Excess cash handed by customer to be returned to them.",
    status: "Correct",
    notes: "Clear and standard phrasing across Rwandan commerce."
  },
  {
    termEn: "Cashier",
    termRwCurrent: "Kashiyeri / Umukozi",
    termRwSuggested: "Umukozi wo gucuruza (Kashiyeri)",
    context: "Store employee with delegated point-of-sale privileges.",
    status: "Correct",
    notes: "'Kashiyeri' is standard conversational Rwandan loanword. 'Umukozi wo gucuruza' is formal Kinyarwanda."
  },
  {
    termEn: "Shop Owner",
    termRwCurrent: "Nyir'iduka / Umukoresha",
    termRwSuggested: "Nyir'iduka",
    context: "Account owner with full administrative, financial, and staff privileges.",
    status: "Correct",
    notes: "'Nyir'iduka' is the authentic, culturally accurate term for shop proprietor."
  },
  {
    termEn: "Inventory / Stock",
    termRwCurrent: "Ububiko / Ibicuruzwa",
    termRwSuggested: "Ububiko bw'ibicuruzwa",
    context: "Catalog of merchandise in store with quantities and pricing.",
    status: "Correct",
    notes: "'Ububiko' directly refers to the storehouse/stockroom, very natural in retail."
  },
  {
    termEn: "Out of Stock",
    termRwCurrent: "Byashize mu bubiko",
    termRwSuggested: "Byashize mu bubiko",
    context: "Badge and indicator when item quantity equals zero.",
    status: "Correct",
    notes: "Immediate, natural, and clear to shopkeepers."
  },
  {
    termEn: "Low Stock Alert",
    termRwCurrent: "Ntabwo bihagije mu bubiko",
    termRwSuggested: "Biri hafi gushira (Bigeze hasi)",
    context: "Warning badge when stock drops below threshold.",
    status: "Needs correction",
    notes: "'Ntabwo bihagije mu bubiko' means 'Not enough in store'. In retail inventory management, 'Biri hafi gushira' (running low) or 'Bigeze ku gipimo cyo hasi' is standard."
  },
  {
    termEn: "Financial Reports",
    termRwCurrent: "Raporo y'amafaranga",
    termRwSuggested: "Raporo y'ubucuruzi",
    context: "Page tracking daily sales, collections, profits, and revenue.",
    status: "Correct",
    notes: "'Raporo y'amafaranga' is easily understood, though 'Raporo y'ubucuruzi' covers both volume, revenue, and margins."
  },
  {
    termEn: "Session Expired",
    termRwCurrent: "Session yarangiye",
    termRwSuggested: "Igihe cyo kwinjira cyarangiye",
    context: "Security alert when user token is invalidated or revoked.",
    status: "Needs correction",
    notes: "Raw tech loanword 'Session'. Natural Kinyarwanda: 'Igihe cyo gukoresha konti cyarangiye — ongera winjire'."
  },
  {
    termEn: "Synchronizing",
    termRwCurrent: "Birasangizwa...",
    termRwSuggested: "Guhuza amakuru...",
    context: "Offline-to-cloud synchronization status indicator.",
    status: "Needs correction",
    notes: "'Birasangizwa' implies 'being shared'. In database synchronization, 'Guhuza amakuru' (reconciling/aligning data) is accurate."
  }
];

export const authCatalog = [
  {
    id: "AUTH-001",
    module: "Authentication / Splash",
    element: "Splash Screen Title",
    en: "Sella",
    rwCurrent: "Sella",
    rwSuggested: "Sella",
    rwFinal: "",
    status: "Correct",
    notes: "Brand mark"
  },
  {
    id: "AUTH-002",
    module: "Authentication / Splash",
    element: "Splash Tagline",
    en: "Simple retail management for Rwanda",
    rwCurrent: "Ubucuruzi bwawe mu buryo bworoshye",
    rwSuggested: "Ubucuruzi bwawe mu buryo bworoshye",
    rwFinal: "",
    status: "Correct",
    notes: "Rendered on mobile boot splash"
  },
  {
    id: "AUTH-003",
    module: "Authentication / Welcome",
    element: "Page Heading",
    en: "Welcome back",
    rwCurrent: "Murakaza neza",
    rwSuggested: "Murakaza neza",
    rwFinal: "",
    status: "Correct",
    notes: "Primary title on auth home"
  },
  {
    id: "AUTH-004",
    module: "Authentication / Welcome",
    element: "Page Subtitle",
    en: "Choose an account or sign in to your shop",
    rwCurrent: "Hitamo konti cyangwa winjire muri shop yawe",
    rwSuggested: "Hitamo konti cyangwa winjire mu iduka ryawe",
    rwFinal: "",
    status: "Needs correction",
    notes: "'shop' is colloquial English loanword; 'iduka ryawe' is standard Rwandan phrasing."
  },
  {
    id: "AUTH-005",
    module: "Authentication / Welcome",
    element: "Primary Button",
    en: "Sign in with PIN",
    rwCurrent: "Injiza PIN",
    rwSuggested: "Injiza PIN",
    rwFinal: "",
    status: "Correct",
    notes: "Main action for remembered accounts"
  },
  {
    id: "AUTH-006",
    module: "Authentication / Welcome",
    element: "Secondary Button",
    en: "Sign in with another number",
    rwCurrent: "Injira n'indi telefone",
    rwSuggested: "Injira n'indi numero ya telefone",
    rwFinal: "",
    status: "Correct",
    notes: "Switches to phone input"
  },
  {
    id: "AUTH-007",
    module: "Authentication / Welcome",
    element: "Action Button",
    en: "Register new shop",
    rwCurrent: "Fungura konti nshya ya shop",
    rwSuggested: "Fungura konti nshya y'iduka",
    rwFinal: "",
    status: "Needs correction",
    notes: "Replaces 'shop' with 'iduka'"
  },
  {
    id: "AUTH-008",
    module: "Authentication / Cashier Entry",
    element: "Action Button",
    en: "Are you a cashier? Join with Shop Code",
    rwCurrent: "Uri umukozi wo gucuruza? Injira na Shop Code",
    rwSuggested: "Uri kashiyeri? Injira ukoresheje Shop Code",
    rwFinal: "",
    status: "Correct",
    notes: "Launches cashier onboarding flow"
  },
  {
    id: "AUTH-009",
    module: "Authentication / Phone Login",
    element: "Form Heading",
    en: "Enter your phone number",
    rwCurrent: "Injiza numero ya telefone",
    rwSuggested: "Injiza numero ya telefone",
    rwFinal: "",
    status: "Correct",
    notes: "Prompt for phone input"
  },
  {
    id: "AUTH-010",
    module: "Authentication / Phone Login",
    element: "Input Placeholder",
    en: "078X XXX XXX",
    rwCurrent: "078X XXX XXX",
    rwSuggested: "078X XXX XXX",
    rwFinal: "",
    status: "Correct",
    notes: "Rwandan MTN/Airtel phone mask"
  },
  {
    id: "AUTH-011",
    module: "Authentication / Phone Login",
    element: "Helper Text",
    en: "We will use this number to identify your account",
    rwCurrent: "Iyi numero niyo igufasha kwinjira muri konti yawe",
    rwSuggested: "Iyi numero niyo igufasha kwinjira muri konti yawe",
    rwFinal: "",
    status: "Correct",
    notes: "Security and account guidance"
  },
  {
    id: "AUTH-012",
    module: "Authentication / Phone Login",
    element: "Validation Error",
    en: "Please enter a valid Rwandan phone number",
    rwCurrent: "Shyiramo numero ya telefone yo mu Rwanda yemewe",
    rwSuggested: "Shyiramo numero ya telefone nyarwanda yuzuye",
    rwFinal: "",
    status: "Correct",
    notes: "Triggered on invalid regex"
  },
  {
    id: "AUTH-013",
    module: "Authentication / PIN Entry",
    element: "Screen Title",
    en: "Enter your 4-digit PIN",
    rwCurrent: "Injiza PIN yawe y'imibare 4",
    rwSuggested: "Injiza PIN yawe y'imibare 4",
    rwFinal: "",
    status: "Correct",
    notes: "Standard dialpad heading"
  },
  {
    id: "AUTH-014",
    module: "Authentication / PIN Entry",
    element: "Dialpad Subtitle",
    en: "Keep your PIN secret",
    rwCurrent: "PIN yawe igomba kuba ibanga",
    rwSuggested: "PIN yawe igomba kuba ibanga",
    rwFinal: "",
    status: "Correct",
    notes: "Security prompt"
  },
  {
    id: "AUTH-015",
    module: "Authentication / PIN Entry",
    element: "Error Message",
    en: "Incorrect PIN. Try again.",
    rwCurrent: "PIN ntiyemewe. Ongera ugerageze.",
    rwSuggested: "PIN ntiyemewe. Ongera ugerageze.",
    rwFinal: "",
    status: "Correct",
    notes: "Shown on PIN mismatch"
  },
  {
    id: "AUTH-016",
    module: "Authentication / PIN Entry",
    element: "Lockout Warning",
    en: "Too many incorrect attempts. Please wait {seconds}s",
    rwCurrent: "Wagerageje kenshi nabi. Tegereza amasegonda {seconds}",
    rwSuggested: "Wagerageje kenshi bitemewe. Tegereza amasegonda {seconds}",
    rwFinal: "",
    status: "Correct",
    notes: "Brute force prevention message"
  },
  {
    id: "AUTH-017",
    module: "Authentication / PIN Entry",
    element: "Action Link",
    en: "Forgot your PIN?",
    rwCurrent: "Wibagiwe PIN?",
    rwSuggested: "Wibagiwe PIN yawe?",
    rwFinal: "",
    status: "Correct",
    notes: "Opens password/recovery flow"
  },
  {
    id: "AUTH-018",
    module: "Authentication / Register",
    element: "Modal Title",
    en: "Create shop account",
    rwCurrent: "Fungura konti nshya ya shop",
    rwSuggested: "Fungura konti nshya y'iduka",
    rwFinal: "",
    status: "Needs correction",
    notes: "Standardize 'shop' to 'iduka'"
  },
  {
    id: "AUTH-019",
    module: "Authentication / Register",
    element: "Form Label",
    en: "Business / Shop Name *",
    rwCurrent: "Izina rya shop / ubucuruzi *",
    rwSuggested: "Izina ry'iduka / ubucuruzi *",
    rwFinal: "",
    status: "Needs correction",
    notes: "Standardize 'shop' to 'iduka'"
  },
  {
    id: "AUTH-020",
    module: "Authentication / Register",
    element: "Input Placeholder",
    en: "e.g. Kigali Fashion Boutique",
    rwCurrent: "urugero: Kigali Fashion Boutique",
    rwSuggested: "urugero: Kigali Fashion Boutique",
    rwFinal: "",
    status: "Correct",
    notes: "Sample placeholder"
  },
  {
    id: "AUTH-021",
    module: "Authentication / Register",
    element: "Form Label",
    en: "Owner's Full Name *",
    rwCurrent: "Amazina ya nyir'iduka *",
    rwSuggested: "Amazina ya nyir'iduka *",
    rwFinal: "",
    status: "Correct",
    notes: "Owner name input"
  },
  {
    id: "AUTH-022",
    module: "Authentication / Register",
    element: "Form Label",
    en: "Owner's Phone Number *",
    rwCurrent: "Numero ya telefone *",
    rwSuggested: "Numero ya telefone ya nyir'iduka *",
    rwFinal: "",
    status: "Correct",
    notes: "Phone field"
  },
  {
    id: "AUTH-023",
    module: "Authentication / Register",
    element: "Form Label",
    en: "Email Address (for recovery & invoices)",
    rwCurrent: "Email (yo kugarura konti na fagitire)",
    rwSuggested: "Aderesi ya Email (yo kugarura konti na fagitire)",
    rwFinal: "",
    status: "Correct",
    notes: "Optional email"
  },
  {
    id: "AUTH-024",
    module: "Authentication / Register",
    element: "Form Label",
    en: "Create a 4-Digit Security PIN *",
    rwCurrent: "Hitamo PIN y'imibare 4 *",
    rwSuggested: "Hitamo PIN y'imibare 4 yo gukoresha *",
    rwFinal: "",
    status: "Correct",
    notes: "PIN setting field"
  },
  {
    id: "AUTH-025",
    module: "Authentication / Register",
    element: "Form Label",
    en: "Confirm 4-Digit PIN *",
    rwCurrent: "Emeza PIN yawe *",
    rwSuggested: "Subiramo PIN yawe uyemeze *",
    rwFinal: "",
    status: "Correct",
    notes: "PIN confirmation field"
  },
  {
    id: "AUTH-026",
    module: "Authentication / Register",
    element: "Validation Error",
    en: "PINs do not match",
    rwCurrent: "PIN zombi ntizihuye",
    rwSuggested: "PIN zombi ntabwo zihuye",
    rwFinal: "",
    status: "Correct",
    notes: "PIN discrepancy warning"
  },
  {
    id: "AUTH-027",
    module: "Authentication / Register",
    element: "Submit Button",
    en: "Create Account",
    rwCurrent: "Fungura konti",
    rwSuggested: "Fungura konti",
    rwFinal: "",
    status: "Correct",
    notes: "Primary register CTA"
  },
  {
    id: "AUTH-028",
    module: "Authentication / Cashier Onboarding",
    element: "Modal Title",
    en: "Cashier Access · Join Shop",
    rwCurrent: "Kwinjira nk'umukozi · Huza na Shop",
    rwSuggested: "Kwinjira nk'umukozi · Huza n'iduka",
    rwFinal: "",
    status: "Needs correction",
    notes: "Replace 'Shop' with 'Iduka'"
  },
  {
    id: "AUTH-029",
    module: "Authentication / Cashier Onboarding",
    element: "Input Label",
    en: "Enter Shop Code (e.g. SEL-XXXXXX)",
    rwCurrent: "Shyiramo Shop Code (urugero: SEL-XXXXXX)",
    rwSuggested: "Shyiramo Kode y'iduka / Shop Code (urugero: SEL-XXXXXX)",
    rwFinal: "",
    status: "Correct",
    notes: "Primary identifier"
  },
  {
    id: "AUTH-030",
    module: "Authentication / Cashier Onboarding",
    element: "Helper Text",
    en: "Ask your shop owner to give you the 6-character Shop Code from their Staff Management page.",
    rwCurrent: "Saba nyir'iduka aguhe Shop Code y'inyuguti 6 iri ku rupapuro rw'abakozi.",
    rwSuggested: "Saba nyir'iduka aguhe Kode y'iduka (Shop Code) y'inyuguti 6 iri mu gice cy'abakozi.",
    rwFinal: "",
    status: "Correct",
    notes: "Clear onboarding instruction"
  },
  {
    id: "AUTH-031",
    module: "Authentication / Cashier Onboarding",
    element: "Action Button",
    en: "Check Shop Code",
    rwCurrent: "Reba iyi Shop Code",
    rwSuggested: "Genzura iyi Shop Code",
    rwFinal: "",
    status: "Correct",
    notes: "Validates code against Supabase"
  },
  {
    id: "AUTH-032",
    module: "Authentication / Cashier Onboarding",
    element: "Success Badge",
    en: "Shop Verified: {shop_name}",
    rwCurrent: "Shop yabonetse: {shop_name}",
    rwSuggested: "Iduka ryabonetse: {shop_name}",
    rwFinal: "",
    status: "Needs correction",
    notes: "Replace 'Shop' with 'Iduka'"
  },
  {
    id: "AUTH-033",
    module: "Authentication / Cashier Onboarding",
    element: "Input Label",
    en: "Your Full Name *",
    rwCurrent: "Izina ryawe ryose *",
    rwSuggested: "Amazina yawe yose *",
    rwFinal: "",
    status: "Correct",
    notes: "Cashier identity"
  },
  {
    id: "AUTH-034",
    module: "Authentication / Cashier Onboarding",
    element: "Input Label",
    en: "Your Phone Number *",
    rwCurrent: "Numero ya telefone yawe *",
    rwSuggested: "Numero ya telefone yawe *",
    rwFinal: "",
    status: "Correct",
    notes: "Cashier phone"
  },
  {
    id: "AUTH-035",
    module: "Authentication / Cashier Onboarding",
    element: "Step Heading",
    en: "Create your personal cashier PIN",
    rwCurrent: "Shyiraho PIN yawe nshya yo gucuruza",
    rwSuggested: "Shyiraho PIN yawe bwite yo gucuruza",
    rwFinal: "",
    status: "Correct",
    notes: "Cashier personal PIN step"
  },
  {
    id: "AUTH-036",
    module: "Authentication / Cashier Onboarding",
    element: "Step Heading",
    en: "Confirm your cashier PIN",
    rwCurrent: "Emeza PIN yawe yo gucuruza",
    rwSuggested: "Subiramo PIN yawe yo gucuruza uyemeze",
    rwFinal: "",
    status: "Correct",
    notes: "Cashier PIN confirmation"
  },
  {
    id: "AUTH-037",
    module: "Authentication / Cashier Onboarding",
    element: "Error Message",
    en: "Invalid Shop Code. Please verify with your shop owner.",
    rwCurrent: "Shop Code ntiyemewe. Baza nyir'iduka.",
    rwSuggested: "Shop Code ntiyemewe cyangwa ntabwo ibonetse. Baza nyir'iduka.",
    rwFinal: "",
    status: "Correct",
    notes: "Rejection notification"
  },
  {
    id: "AUTH-038",
    module: "Authentication / Cashier Onboarding",
    element: "Error Message",
    en: "This cashier phone is not yet authorized in this shop roster.",
    rwCurrent: "Iyi telefone ntiyanditse mu bakozi b'iri duka. Nyir'iduka agomba kubanza kukongeramo.",
    rwSuggested: "Iyi numero ya telefone ntabwo yanditse mu bakozi b'iri duka. Nyir'iduka agomba kubanza kuyongeramo.",
    rwFinal: "",
    status: "Correct",
    notes: "Authorization gate"
  },
  {
    id: "AUTH-039",
    module: "Authentication / Cashier Onboarding",
    element: "Success Toast",
    en: "Cashier onboarded successfully! Welcome to {shop_name}.",
    rwCurrent: "Kwinjira nk'umukozi byakunze! Murakaza neza muri {shop_name}.",
    rwSuggested: "Kwinjira nk'umukozi byakunze neza! Murakaza neza muri {shop_name}.",
    rwFinal: "",
    status: "Correct",
    notes: "Completion toast"
  },
  {
    id: "AUTH-040",
    module: "Authentication / Logout",
    element: "Confirmation Dialog",
    en: "Are you sure you want to sign out?",
    rwCurrent: "Urashaka gusohoka?",
    rwSuggested: "Wizeye neza ko ushaka gusohoka muri konti?",
    rwFinal: "",
    status: "Correct",
    notes: "Logout prompt"
  },
  {
    id: "AUTH-041",
    module: "Authentication / Logout",
    element: "Confirm Button",
    en: "Sign Out",
    rwCurrent: "Sohoka",
    rwSuggested: "Sohoka",
    rwFinal: "",
    status: "Correct",
    notes: "Logout action"
  },
  {
    id: "AUTH-042",
    module: "Authentication / Logout",
    element: "Cancel Button",
    en: "Cancel",
    rwCurrent: "Hagarika",
    rwSuggested: "Reka",
    rwFinal: "",
    status: "Correct",
    notes: "Dismiss action"
  }
];

export const dashboardCatalog = [
  {
    id: "DASH-001",
    module: "Dashboard",
    element: "Page Title",
    en: "Home / Dashboard",
    rwCurrent: "Ahabanza",
    rwSuggested: "Ahabanza",
    rwFinal: "",
    status: "Correct",
    notes: "Header brand bar"
  },
  {
    id: "DASH-002",
    module: "Dashboard",
    element: "Morning Greeting",
    en: "Good morning, {name}",
    rwCurrent: "Mwaramutse, {name}",
    rwSuggested: "Mwaramutse, {name}",
    rwFinal: "",
    status: "Correct",
    notes: "Time-based greeting before 12:00"
  },
  {
    id: "DASH-003",
    module: "Dashboard",
    element: "Afternoon Greeting",
    en: "Good afternoon, {name}",
    rwCurrent: "Mwiriwe, {name}",
    rwSuggested: "Mwiriwe, {name}",
    rwFinal: "",
    status: "Correct",
    notes: "Time-based greeting 12:00-17:00"
  },
  {
    id: "DASH-004",
    module: "Dashboard",
    element: "Evening Greeting",
    en: "Good evening, {name}",
    rwCurrent: "Muramuke, {name}",
    rwSuggested: "Mwiriwe neza, {name}",
    rwFinal: "",
    status: "Needs correction",
    notes: "'Muramuke' is actually used as good night / goodbye when parting for bed. In the evening while working in a store, 'Mwiriwe neza' is much more natural."
  },
  {
    id: "DASH-005",
    module: "Dashboard",
    element: "Period Switcher",
    en: "Today",
    rwCurrent: "Uyu munsi",
    rwSuggested: "Uyu munsi",
    rwFinal: "",
    status: "Correct",
    notes: "Active tab"
  },
  {
    id: "DASH-006",
    module: "Dashboard",
    element: "Period Switcher",
    en: "This Week",
    rwCurrent: "Icyumweru",
    rwSuggested: "Iki cyumweru",
    rwFinal: "",
    status: "Needs correction",
    notes: "'Icyumweru' means a week. 'Iki cyumweru' specifically means 'this week'."
  },
  {
    id: "DASH-007",
    module: "Dashboard / KPI Card",
    element: "Card Title",
    en: "Total Unpaid Debt",
    rwCurrent: "Ideni ritarishyurwa",
    rwSuggested: "Amadeni yose atarishyurwa",
    rwFinal: "",
    status: "Correct",
    notes: "Primary outstanding debt metric"
  },
  {
    id: "DASH-008",
    module: "Dashboard / KPI Card",
    element: "Card Subtitle",
    en: "Across all active clients",
    rwCurrent: "Ku bakiriya bose",
    rwSuggested: "Ku bakiriya bose baberewemo amadeni",
    rwFinal: "",
    status: "Correct",
    notes: "Card annotation"
  },
  {
    id: "DASH-009",
    module: "Dashboard / KPI Card",
    element: "Card Title",
    en: "Money Collected Today",
    rwCurrent: "Amafaranga yinjiye uyu munsi",
    rwSuggested: "Amafaranga yakiriwe uyu munsi",
    rwFinal: "",
    status: "Correct",
    notes: "Cash & electronic payments collected"
  },
  {
    id: "DASH-010",
    module: "Dashboard / KPI Card",
    element: "Card Title",
    en: "Money Collected This Week",
    rwCurrent: "Amafaranga yinjiye iki cyumweru",
    rwSuggested: "Amafaranga yakiriwe iki cyumweru",
    rwFinal: "",
    status: "Correct",
    notes: "Weekly collections"
  },
  {
    id: "DASH-011",
    module: "Dashboard / KPI Card",
    element: "Card Title",
    en: "Sales Volume / Value",
    rwCurrent: "Agaciro k'ibicuruzwa",
    rwSuggested: "Agaciro k'ibyagurishijwe",
    rwFinal: "",
    status: "Needs correction",
    notes: "'Agaciro k'ibicuruzwa' sounds like stock valuation. 'Agaciro k'ibyagurishijwe' accurately means sales volume."
  },
  {
    id: "DASH-012",
    module: "Dashboard / KPI Card",
    element: "Card Title",
    en: "Credit Given Today",
    rwCurrent: "Ideni ryatanzwe uyu munsi",
    rwSuggested: "Ideni ryatanzwe uyu munsi",
    rwFinal: "",
    status: "Correct",
    notes: "Credit extended"
  },
  {
    id: "DASH-013",
    module: "Dashboard / Quick Actions",
    element: "Section Header",
    en: "Quick Actions",
    rwCurrent: "Ibikorwa byihuse",
    rwSuggested: "Ibikorwa byihuse",
    rwFinal: "",
    status: "Correct",
    notes: "Section heading"
  },
  {
    id: "DASH-014",
    module: "Dashboard / Quick Actions",
    element: "Primary Action Button",
    en: "New Sale",
    rwCurrent: "Igurisha rishya",
    rwSuggested: "Igurisha rishya (Gucuruza)",
    rwFinal: "",
    status: "Correct",
    notes: "Navigates to POS"
  },
  {
    id: "DASH-015",
    module: "Dashboard / Quick Actions",
    element: "Action Button",
    en: "View Sales & Reports",
    rwCurrent: "Reba amafaranga",
    rwSuggested: "Reba raporo y'amafaranga",
    rwFinal: "",
    status: "Needs correction",
    notes: "'Reba amafaranga' is ambiguous; 'Reba raporo y'amafaranga' is explicit."
  },
  {
    id: "DASH-016",
    module: "Dashboard / Quick Actions",
    element: "Action Button",
    en: "Debts / Customer Ledger",
    rwCurrent: "Ideni",
    rwSuggested: "Amadeni y'abakiriya",
    rwFinal: "",
    status: "Needs correction",
    notes: "Plural 'Amadeni' clarifies customer ledger vs singular debt."
  },
  {
    id: "DASH-017",
    module: "Dashboard / Quick Actions",
    element: "Action Button",
    en: "Inventory & Stock",
    rwCurrent: "Ububiko",
    rwSuggested: "Ububiko bw'ibicuruzwa",
    rwFinal: "",
    status: "Correct",
    notes: "Stock management"
  },
  {
    id: "DASH-018",
    module: "Dashboard / Alerts",
    element: "Banner Header",
    en: "Overdue Debts Alert",
    rwCurrent: "Kwishyuza amadeni yarengeje igihe",
    rwSuggested: "Kwishyuza amadeni yarengeje igihe",
    rwFinal: "",
    status: "Correct",
    notes: "Alerts banner on dashboard"
  },
  {
    id: "DASH-019",
    module: "Dashboard / Alerts",
    element: "Banner CTA",
    en: "Send Reminders",
    rwCurrent: "Ohereza ubutumwa bwo kwibutsa",
    rwSuggested: "Ohereza ubutumwa bwo kwibutsa",
    rwFinal: "",
    status: "Correct",
    notes: "Opens WhatsApp reminder drawer"
  },
  {
    id: "DASH-020",
    module: "Dashboard / Offline",
    element: "Status Badge",
    en: "Offline Mode · Saved Locally",
    rwCurrent: "Nta murongo uriho · Byabitswe kuri telefone",
    rwSuggested: "Nta murongo uriho · Byabitswe kuri telefone",
    rwFinal: "",
    status: "Correct",
    notes: "Local Dexie persistence indicator"
  }
];

export const salesCatalog = [
  {
    id: "SALE-001",
    module: "Sales / POS Register",
    element: "Page Header",
    en: "New Sale & Register",
    rwCurrent: "Igurisha rishya",
    rwSuggested: "Igurisha rishya",
    rwFinal: "",
    status: "Correct",
    notes: "Top header"
  },
  {
    id: "SALE-002",
    module: "Sales / POS Register",
    element: "Search Input Placeholder",
    en: "Search products by name or barcode...",
    rwCurrent: "Shakisha ibicuruzwa…",
    rwSuggested: "Shakisha ikicuruzwa cyangwa kanda barcode…",
    rwFinal: "",
    status: "Correct",
    notes: "Product search"
  },
  {
    id: "SALE-003",
    module: "Sales / POS Register",
    element: "Category Filter Option",
    en: "All Categories",
    rwCurrent: "Byose",
    rwSuggested: "Ibyiciro byose",
    rwFinal: "",
    status: "Correct",
    notes: "Filter pill"
  },
  {
    id: "SALE-004",
    module: "Sales / POS Register",
    element: "Item Card Stock Badge",
    en: "{count} in stock",
    rwCurrent: "Bisigaye: {count}",
    rwSuggested: "Bisigaye mu bubiko: {count}",
    rwFinal: "",
    status: "Correct",
    notes: "Available stock"
  },
  {
    id: "SALE-005",
    module: "Sales / POS Register",
    element: "Item Card Out of Stock",
    en: "Out of Stock",
    rwCurrent: "Byashize mu bubiko",
    rwSuggested: "Byashize mu bubiko",
    rwFinal: "",
    status: "Correct",
    notes: "Zero quantity badge"
  },
  {
    id: "SALE-006",
    module: "Sales / POS Register",
    element: "Quantity Popover Title",
    en: "Select Quantity",
    rwCurrent: "Hitamo umubare",
    rwSuggested: "Hitamo ingano y'ibyo agura",
    rwFinal: "",
    status: "Correct",
    notes: "Quantity dialog"
  },
  {
    id: "SALE-007",
    module: "Sales / POS Register",
    element: "Quantity Popover Button",
    en: "Add to Cart",
    rwCurrent: "Ongeraho mu gatebo",
    rwSuggested: "Ongeraho ku byatoranyijwe",
    rwFinal: "",
    status: "Needs correction",
    notes: "'Agatebo' replaced by 'Ibyatoranyijwe'"
  },
  {
    id: "SALE-008",
    module: "Sales / Cart",
    element: "Drawer Title",
    en: "Cart ({count})",
    rwCurrent: "Agatebo ({count})",
    rwSuggested: "Ibyatoranyijwe ({count})",
    rwFinal: "",
    status: "Needs correction",
    notes: "'Agatebo' replaced with 'Ibyatoranyijwe'"
  },
  {
    id: "SALE-009",
    module: "Sales / Cart",
    element: "Empty Cart Message",
    en: "No items in cart yet",
    rwCurrent: "Nta kintu kiri mu gatebo",
    rwSuggested: "Nta bicuruzwa biratoranywa",
    rwFinal: "",
    status: "Needs correction",
    notes: "Standardizing terminology"
  },
  {
    id: "SALE-010",
    module: "Sales / Cart",
    element: "Summary Row Label",
    en: "Subtotal",
    rwCurrent: "Igiteranyo",
    rwSuggested: "Igiteranyo cy'agateganyo",
    rwFinal: "",
    status: "Correct",
    notes: "Pre-discount total"
  },
  {
    id: "SALE-011",
    module: "Sales / Cart",
    element: "Discount Input Label",
    en: "Discount",
    rwCurrent: "Kugabanya",
    rwSuggested: "Kugabanyirizwa (Discount)",
    rwFinal: "",
    status: "Correct",
    notes: "Price reduction"
  },
  {
    id: "SALE-012",
    module: "Sales / Cart",
    element: "Grand Total Label",
    en: "Total Amount Due",
    rwCurrent: "Igiteranyo cyose",
    rwSuggested: "Igiteranyo cyose",
    rwFinal: "",
    status: "Correct",
    notes: "Final payable amount"
  },
  {
    id: "SALE-013",
    module: "Sales / Checkout",
    element: "Section Title",
    en: "Payment Details",
    rwCurrent: "Kwishyura",
    rwSuggested: "Imiterere yo kwishyura",
    rwFinal: "",
    status: "Correct",
    notes: "Checkout stage"
  },
  {
    id: "SALE-014",
    module: "Sales / Checkout",
    element: "Payment Method Button",
    en: "Cash",
    rwCurrent: "Cash",
    rwSuggested: "Amafaranga mu ntoki (Cash)",
    rwFinal: "",
    status: "Correct",
    notes: "Cash option"
  },
  {
    id: "SALE-015",
    module: "Sales / Checkout",
    element: "Payment Method Button",
    en: "MTN MoMo",
    rwCurrent: "MTN MoMo",
    rwSuggested: "MTN MoMo",
    rwFinal: "",
    status: "Correct",
    notes: "Mobile money option"
  },
  {
    id: "SALE-016",
    module: "Sales / Checkout",
    element: "Payment Method Button",
    en: "Airtel Money",
    rwCurrent: "Airtel Money",
    rwSuggested: "Airtel Money",
    rwFinal: "",
    status: "Correct",
    notes: "Mobile money option"
  },
  {
    id: "SALE-017",
    module: "Sales / Checkout",
    element: "Payment Method Button",
    en: "Bank Transfer",
    rwCurrent: "Banki",
    rwSuggested: "Kuri Banki",
    rwFinal: "",
    status: "Correct",
    notes: "Bank option"
  },
  {
    id: "SALE-018",
    module: "Sales / Checkout",
    element: "Field Label",
    en: "Paying Now",
    rwCurrent: "Arishyura nonaha",
    rwSuggested: "Ayishyuwe nonaha",
    rwFinal: "",
    status: "Correct",
    notes: "Immediate payment amount"
  },
  {
    id: "SALE-019",
    module: "Sales / Checkout",
    element: "Field Label",
    en: "Balance Due / Credit",
    rwCurrent: "Asigaye / ideni",
    rwSuggested: "Asigaye ku ideni",
    rwFinal: "",
    status: "Inconsistent terminology",
    notes: "Clear distinction between change and credit"
  },
  {
    id: "SALE-020",
    module: "Sales / Checkout",
    element: "Field Label",
    en: "Change to Return",
    rwCurrent: "Amafaranga yo gusubiza",
    rwSuggested: "Amafaranga yo gusubiza umukiriya",
    rwFinal: "",
    status: "Correct",
    notes: "Cashier change calculation"
  },
  {
    id: "SALE-021",
    module: "Sales / Checkout",
    element: "Customer Input Label",
    en: "Customer Name (Required if credit)",
    rwCurrent: "Izina ry'umukiriya (hari ideni)",
    rwSuggested: "Izina ry'umukiriya (Rirakenewe niba asigayemo ideni)",
    rwFinal: "",
    status: "Correct",
    notes: "Customer requirement rule"
  },
  {
    id: "SALE-022",
    module: "Sales / Checkout",
    element: "Due Date Picker Label",
    en: "Payment Due Date",
    rwCurrent: "Itariki yo kwishyura",
    rwSuggested: "Itariki ntarengwa yo kwishyura",
    rwFinal: "",
    status: "Correct",
    notes: "Calendar picker for credit"
  },
  {
    id: "SALE-023",
    module: "Sales / Checkout",
    element: "Action Button",
    en: "Complete Sale",
    rwCurrent: "Emeza igurisha",
    rwSuggested: "Emeza igurisha",
    rwFinal: "",
    status: "Correct",
    notes: "Finalizes transaction"
  },
  {
    id: "SALE-024",
    module: "Sales / Completion",
    element: "Success Title",
    en: "Sale Completed!",
    rwCurrent: "Igurisha ryarangiye",
    rwSuggested: "Igurisha ryarangiye neza!",
    rwFinal: "",
    status: "Correct",
    notes: "Completion screen title"
  },
  {
    id: "SALE-025",
    module: "Sales / Completion",
    element: "Action Button",
    en: "Print Receipt",
    rwCurrent: "Printinga resi",
    rwSuggested: "Gucapa resi",
    rwFinal: "",
    status: "Needs correction",
    notes: "Replaces 'Printinga' with 'Gucapa'"
  },
  {
    id: "SALE-026",
    module: "Sales / Completion",
    element: "Action Button",
    en: "Send SMS Receipt",
    rwCurrent: "Ohereza SMS",
    rwSuggested: "Ohereza resi muri SMS",
    rwFinal: "",
    status: "Correct",
    notes: "Direct SMS gateway"
  },
  {
    id: "SALE-027",
    module: "Sales / Completion",
    element: "Action Button",
    en: "New Sale",
    rwCurrent: "Igurisha rishya",
    rwSuggested: "Tangira irindi gurisha",
    rwFinal: "",
    status: "Correct",
    notes: "Resets POS state"
  }
];

export const inventoryCatalog = [
  {
    id: "INV-001",
    module: "Inventory",
    element: "Page Title",
    en: "Inventory & Stock",
    rwCurrent: "Ububiko",
    rwSuggested: "Ububiko bw'ibicuruzwa",
    rwFinal: "",
    status: "Correct",
    notes: "Page title"
  },
  {
    id: "INV-002",
    module: "Inventory",
    element: "Page Subtitle",
    en: "Manage products, stock levels & prices",
    rwCurrent: "Ibicuruzwa biri mu bubiko",
    rwSuggested: "Genzura ibicuruzwa, ibiri mu bubiko n'ibiciro",
    rwFinal: "",
    status: "Correct",
    notes: "Subtitle"
  },
  {
    id: "INV-003",
    module: "Inventory",
    element: "Primary Button",
    en: "Add Product",
    rwCurrent: "Ongeraho ikicuruzwa",
    rwSuggested: "Ongeraho ikicuruzwa",
    rwFinal: "",
    status: "Correct",
    notes: "Opens creation modal"
  },
  {
    id: "INV-004",
    module: "Inventory",
    element: "Search Placeholder",
    en: "Search products in stock...",
    rwCurrent: "Shakisha ibicuruzwa…",
    rwSuggested: "Shakisha ikicuruzwa mu bubiko…",
    rwFinal: "",
    status: "Correct",
    notes: "Inventory search input"
  },
  {
    id: "INV-005",
    module: "Inventory",
    element: "Filter Pill",
    en: "Low Stock Alert",
    rwCurrent: "Ntabwo bihagije",
    rwSuggested: "Biri hafi gushira",
    rwFinal: "",
    status: "Needs correction",
    notes: "Standard retail phrasing"
  },
  {
    id: "INV-006",
    module: "Inventory",
    element: "Filter Pill",
    en: "Out of Stock",
    rwCurrent: "Byashize",
    rwSuggested: "Byashize mu bubiko",
    rwFinal: "",
    status: "Correct",
    notes: "Zero stock filter"
  },
  {
    id: "INV-007",
    module: "Inventory / Add Modal",
    element: "Modal Title",
    en: "Add New Product",
    rwCurrent: "Ongeraho ikicuruzwa gishya",
    rwSuggested: "Ongeraho ikicuruzwa gishya",
    rwFinal: "",
    status: "Correct",
    notes: "Dialog heading"
  },
  {
    id: "INV-008",
    module: "Inventory / Add Modal",
    element: "Input Label",
    en: "Product Name *",
    rwCurrent: "Izina ry'ikicuruzwa *",
    rwSuggested: "Izina ry'ikicuruzwa *",
    rwFinal: "",
    status: "Correct",
    notes: "Name input"
  },
  {
    id: "INV-009",
    module: "Inventory / Add Modal",
    element: "Input Label",
    en: "Cost Price (Buying Price)",
    rwCurrent: "Igiciro cyo kurangura",
    rwSuggested: "Igiciro cyo kurangura",
    rwFinal: "",
    status: "Correct",
    notes: "Cost basis"
  },
  {
    id: "INV-010",
    module: "Inventory / Add Modal",
    element: "Input Label",
    en: "Selling Price *",
    rwCurrent: "Igiciro cyo kugurisha *",
    rwSuggested: "Igiciro cyo kugurisha *",
    rwFinal: "",
    status: "Correct",
    notes: "Retail price"
  },
  {
    id: "INV-011",
    module: "Inventory / Add Modal",
    element: "Input Label",
    en: "Initial Stock Quantity *",
    rwCurrent: "Umubare w'ibiri mu bubiko *",
    rwSuggested: "Ingano y'ibiri mu bubiko *",
    rwFinal: "",
    status: "Correct",
    notes: "Starting quantity"
  },
  {
    id: "INV-012",
    module: "Inventory / Add Modal",
    element: "Input Label",
    en: "Low Stock Alert Threshold",
    rwCurrent: "Umubare wo kuburiraho (Low stock alert)",
    rwSuggested: "Umubare wo kuburiraho ibiri hafi gushira",
    rwFinal: "",
    status: "Needs correction",
    notes: "Removes English loan phrase in parenthesis"
  },
  {
    id: "INV-013",
    module: "Inventory / Add Modal",
    element: "Save Button",
    en: "Save Product",
    rwCurrent: "Bika ikicuruzwa",
    rwSuggested: "Bika ikicuruzwa",
    rwFinal: "",
    status: "Correct",
    notes: "Submission CTA"
  },
  {
    id: "INV-014",
    module: "Inventory / Actions",
    element: "Stock Adjust Button",
    en: "Adjust Stock (+ / -)",
    rwCurrent: "Hindura ingano",
    rwSuggested: "Guhindura ingano y'ibiri mu bubiko",
    rwFinal: "",
    status: "Correct",
    notes: "Stock adjustment action"
  },
  {
    id: "INV-015",
    module: "Inventory / Actions",
    element: "Delete Confirmation",
    en: "Are you sure you want to delete this product?",
    rwCurrent: "Urashaka gusiba iki kicuruzwa?",
    rwSuggested: "Wizeye neza ko ushaka gusiba iki kicuruzwa mu bubiko?",
    rwFinal: "",
    status: "Correct",
    notes: "Destructive alert"
  },
  {
    id: "INV-016",
    module: "Inventory / Import",
    element: "Action Button",
    en: "Import Inventory (CSV / Excel)",
    rwCurrent: "Kuzana ububiko (CSV/Excel)",
    rwSuggested: "Kwinjiza ibicuruzwa byinshi (CSV/Excel)",
    rwFinal: "",
    status: "Correct",
    notes: "Bulk upload entry"
  }
];

export const clientsCatalog = [
  {
    id: "CLI-001",
    module: "Clients",
    element: "Page Header",
    en: "Clients Directory",
    rwCurrent: "Abakiriya",
    rwSuggested: "Urutonde rw'abakiriya",
    rwFinal: "",
    status: "Correct",
    notes: "Page title"
  },
  {
    id: "CLI-002",
    module: "Clients",
    element: "Page Subtitle",
    en: "Manage customer contacts and credit records",
    rwCurrent: "Andika no kubika amakuru y'abakiriya",
    rwSuggested: "Andika no kubika amakuru y'abakiriya",
    rwFinal: "",
    status: "Correct",
    notes: "Header description"
  },
  {
    id: "CLI-003",
    module: "Clients",
    element: "Section Title",
    en: "Add New Client",
    rwCurrent: "Ongeraho Umukiriya",
    rwSuggested: "Ongeraho umukiriya mushya",
    rwFinal: "",
    status: "Correct",
    notes: "Creation card title"
  },
  {
    id: "CLI-004",
    module: "Clients",
    element: "Input Label",
    en: "Client Name *",
    rwCurrent: "Izina ry'umukiriya *",
    rwSuggested: "Izina ry'umukiriya *",
    rwFinal: "",
    status: "Correct",
    notes: "Form label"
  },
  {
    id: "CLI-005",
    module: "Clients",
    element: "Input Placeholder",
    en: "Enter full name...",
    rwCurrent: "Andika izina...",
    rwSuggested: "Andika amazina y'umukiriya...",
    rwFinal: "",
    status: "Correct",
    notes: "Input placeholder"
  },
  {
    id: "CLI-006",
    module: "Clients",
    element: "Input Label",
    en: "Phone Number",
    rwCurrent: "Numero ya Telefone",
    rwSuggested: "Numero ya telefone",
    rwFinal: "",
    status: "Correct",
    notes: "Phone field"
  },
  {
    id: "CLI-007",
    module: "Clients",
    element: "Input Placeholder",
    en: "07X XXX XXXX",
    rwCurrent: "07X XXX XXXX",
    rwSuggested: "07X XXX XXXX",
    rwFinal: "",
    status: "Correct",
    notes: "Rwandan mask"
  },
  {
    id: "CLI-008",
    module: "Clients",
    element: "Submit Button",
    en: "Confirm & Save",
    rwCurrent: "Emeza",
    rwSuggested: "Bika umukiriya",
    rwFinal: "",
    status: "Correct",
    notes: "Save CTA"
  },
  {
    id: "CLI-009",
    module: "Clients",
    element: "Success Toast",
    en: "Client added successfully ✨",
    rwCurrent: "Umukiriya yongeweho neza ✨",
    rwSuggested: "Umukiriya yongeweho neza ✨",
    rwFinal: "",
    status: "Correct",
    notes: "Toast confirmation"
  },
  {
    id: "CLI-010",
    module: "Clients",
    element: "Error Toast",
    en: "Subscription expired — go to Billing to edit clients",
    rwCurrent: "Subscription yarangiye — jya kuri Billing wishyure to edit clients",
    rwSuggested: "Subscription yarangiye — jya kuri Billing wishyure kugira ngo ukomeze guhindura abakiriya",
    rwFinal: "",
    status: "Needs correction",
    notes: "Fixes mixed English sentence 'to edit clients'"
  },
  {
    id: "CLI-011",
    module: "Clients",
    element: "Delete Toast",
    en: "Client deleted",
    rwCurrent: "Umukiriya yasibwe",
    rwSuggested: "Umukiriya yasibwe neza",
    rwFinal: "",
    status: "Correct",
    notes: "Deletion feedback"
  },
  {
    id: "CLI-012",
    module: "Clients",
    element: "Empty State Title",
    en: "No clients yet",
    rwCurrent: "Nta mukiriya uhari",
    rwSuggested: "Nta mukiriya urandikwa",
    rwFinal: "",
    status: "Correct",
    notes: "Empty state"
  },
  {
    id: "CLI-013",
    module: "Clients",
    element: "Empty State Description",
    en: "Add your first client above to get started.",
    rwCurrent: "Ongeraho umukiriya wa mbere hejuru kugira ngo utangire.",
    rwSuggested: "Ongeraho umukiriya wa mbere hejuru kugira ngo utangire.",
    rwFinal: "",
    status: "Correct",
    notes: "Empty guidance"
  }
];

export const debtsCatalog = [
  {
    id: "DEBT-001",
    module: "Debts / Ledger",
    element: "Page Header",
    en: "Customer Debts & Credit Ledger",
    rwCurrent: "Ideni",
    rwSuggested: "Amadeni y'abakiriya",
    rwFinal: "",
    status: "Needs correction",
    notes: "Plural 'Amadeni' is clearer for customer ledger page."
  },
  {
    id: "DEBT-002",
    module: "Debts / Ledger",
    element: "Filter Tab",
    en: "All Debts",
    rwCurrent: "Byose",
    rwSuggested: "Amadeni yose",
    rwFinal: "",
    status: "Correct",
    notes: "Tab label"
  },
  {
    id: "DEBT-003",
    module: "Debts / Ledger",
    element: "Filter Tab",
    en: "Overdue",
    rwCurrent: "Yarengeje igihe",
    rwSuggested: "Yarengeje igihe",
    rwFinal: "",
    status: "Correct",
    notes: "Tab label"
  },
  {
    id: "DEBT-004",
    module: "Debts / Ledger",
    element: "Filter Tab",
    en: "Due Today",
    rwCurrent: "Kwishyura uyu munsi",
    rwSuggested: "Kwishyura uyu munsi",
    rwFinal: "",
    status: "Correct",
    notes: "Tab label"
  },
  {
    id: "DEBT-005",
    module: "Debts / Card",
    element: "Card Label",
    en: "Original Debt",
    rwCurrent: "Amafaranga yose",
    rwSuggested: "Amafaranga yose y'umwimerere",
    rwFinal: "",
    status: "Correct",
    notes: "Original credit sum"
  },
  {
    id: "DEBT-006",
    module: "Debts / Card",
    element: "Card Label",
    en: "Remaining Balance",
    rwCurrent: "Asigaye",
    rwSuggested: "Asigaye kwishyurwa",
    rwFinal: "",
    status: "Correct",
    notes: "Outstanding amount"
  },
  {
    id: "DEBT-007",
    module: "Debts / Actions",
    element: "Record Payment Button",
    en: "Record Payment",
    rwCurrent: "Andika ko yishyuye",
    rwSuggested: "Kwishyura ideni",
    rwFinal: "",
    status: "Correct",
    notes: "Opens payment dialog"
  },
  {
    id: "DEBT-008",
    module: "Debts / Actions",
    element: "Reminder Button",
    en: "Remind on WhatsApp / SMS",
    rwCurrent: "Ibuka / ohereza ubutumwa",
    rwSuggested: "Kwibutsa kuri WhatsApp / SMS",
    rwFinal: "",
    status: "Needs correction",
    notes: "'Ibuka' is imperative active ('Remember!'). 'Kwibutsa' is transitive ('To remind someone')."
  },
  {
    id: "DEBT-009",
    module: "Debts / Actions",
    element: "Export PDF Button",
    en: "Download Debtor Statement",
    rwCurrent: "Inyandiko y'Abadenyi (PDF)",
    rwSuggested: "Inyandiko y'umukiriya uberewemo ideni (PDF)",
    rwFinal: "",
    status: "Needs correction",
    notes: "'Abadenyi' has pejorative tone; replace with respectful phrasing."
  },
  {
    id: "DEBT-010",
    module: "Debts / Actions",
    element: "Export All Debts Report",
    en: "Download All Debts Summary (PDF)",
    rwCurrent: "Raporo y'amadeni yose (PDF)",
    rwSuggested: "Raporo y'amadeni yose atarishyurwa (PDF)",
    rwFinal: "",
    status: "Correct",
    notes: "PDF generator action"
  },
  {
    id: "DEBT-011",
    module: "Debts / Payment Modal",
    element: "Modal Title",
    en: "Record Customer Debt Payment",
    rwCurrent: "Kwishyura ideni",
    rwSuggested: "Kwakira ubwishyu bw'ideni",
    rwFinal: "",
    status: "Correct",
    notes: "Payment dialog"
  },
  {
    id: "DEBT-012",
    module: "Debts / Payment Modal",
    element: "Input Label",
    en: "Amount Paid (FRW) *",
    rwCurrent: "Amafaranga yishyuye (FRW) *",
    rwSuggested: "Amafaranga yishyuye nonaha (FRW) *",
    rwFinal: "",
    status: "Correct",
    notes: "Amount input"
  },
  {
    id: "DEBT-013",
    module: "Debts / Payment Modal",
    element: "Method Selector Label",
    en: "Payment Method",
    rwCurrent: "Uburyo yishyuyemo",
    rwSuggested: "Uburyo akoresheje yishyura",
    rwFinal: "",
    status: "Correct",
    notes: "Method selector"
  },
  {
    id: "DEBT-014",
    module: "Debts / Payment Modal",
    element: "Submit Button",
    en: "Confirm & Generate Receipt",
    rwCurrent: "Emeza ubwishyu",
    rwSuggested: "Emeza ubwishyu ukore na resi",
    rwFinal: "",
    status: "Correct",
    notes: "Save action"
  }
];

export const paymentsCatalog = [
  {
    id: "PAY-001",
    module: "Payments / History",
    element: "Page Title",
    en: "Payment & Transaction History",
    rwCurrent: "Amateka y'ubwishyu",
    rwSuggested: "Amateka y'ubwishyu n'amafaranga yakiriwe",
    rwFinal: "",
    status: "Correct",
    notes: "Transactions ledger"
  },
  {
    id: "PAY-002",
    module: "Payments / History",
    element: "Search Placeholder",
    en: "Search by receipt # or client name...",
    rwCurrent: "Shakisha kuri numero ya resi cyangwa izina...",
    rwSuggested: "Shakisha kuri numero ya resi cyangwa izina...",
    rwFinal: "",
    status: "Correct",
    notes: "Search box"
  },
  {
    id: "PAY-003",
    module: "Payments / Card",
    element: "Method Badge",
    en: "Cash",
    rwCurrent: "Cash",
    rwSuggested: "Cash",
    rwFinal: "",
    status: "Correct",
    notes: "Payment badge"
  },
  {
    id: "PAY-004",
    module: "Payments / Card",
    element: "Method Badge",
    en: "MTN MoMo",
    rwCurrent: "MTN MoMo",
    rwSuggested: "MTN MoMo",
    rwFinal: "",
    status: "Correct",
    notes: "Payment badge"
  },
  {
    id: "PAY-005",
    module: "Payments / Card",
    element: "Action Button",
    en: "View / Reprint Receipt",
    rwCurrent: "Reba resi",
    rwSuggested: "Reba cyangwa ucape resi",
    rwFinal: "",
    status: "Correct",
    notes: "Receipt viewer"
  }
];

export const reportsCatalog = [
  {
    id: "REP-001",
    module: "Reports & Sales History",
    element: "Page Header",
    en: "Sales Reports & Analytics",
    rwCurrent: "Raporo y'amafaranga",
    rwSuggested: "Raporo y'amafaranga n'igurisha",
    rwFinal: "",
    status: "Correct",
    notes: "Top header"
  },
  {
    id: "REP-002",
    module: "Reports & Sales History",
    element: "Time Period Filter",
    en: "Today",
    rwCurrent: "Uyu munsi",
    rwSuggested: "Uyu munsi",
    rwFinal: "",
    status: "Correct",
    notes: "Period filter"
  },
  {
    id: "REP-003",
    module: "Reports & Sales History",
    element: "Time Period Filter",
    en: "Week",
    rwCurrent: "Icyumweru",
    rwSuggested: "Iki cyumweru",
    rwFinal: "",
    status: "Needs correction",
    notes: "'Icyumweru' to 'Iki cyumweru'"
  },
  {
    id: "REP-004",
    module: "Reports & Sales History",
    element: "Time Period Filter",
    en: "Month",
    rwCurrent: "Ukwezi",
    rwSuggested: "Kuku kwezi",
    rwFinal: "",
    status: "Needs correction",
    notes: "'Ukwezi' to 'Kuku kwezi'"
  },
  {
    id: "REP-005",
    module: "Reports & Sales History",
    element: "Summary Metric",
    en: "Total Money Collected",
    rwCurrent: "Amafaranga yakiriwe",
    rwSuggested: "Amafaranga yose yakiriwe",
    rwFinal: "",
    status: "Correct",
    notes: "Realized cashflow"
  },
  {
    id: "REP-006",
    module: "Reports & Sales History",
    element: "Summary Metric",
    en: "Unpaid Debts Extended",
    rwCurrent: "Ideni ritarishyurwa",
    rwSuggested: "Amadeni yatanzwe atarishyurwa",
    rwFinal: "",
    status: "Correct",
    notes: "Unpaid sales"
  },
  {
    id: "REP-007",
    module: "Reports & Sales History",
    element: "Reset Data Button",
    en: "Reset Sales History (Owner Only)",
    rwCurrent: "Tangira bushya",
    rwSuggested: "Gusiba amateka y'amafaranga ukanatangira bushya",
    rwFinal: "",
    status: "Correct",
    notes: "Destructive reset action"
  },
  {
    id: "REP-008",
    module: "Reports & Sales History",
    element: "Reset Dialog Confirmation",
    en: "Are you sure you want to reset all sales records back to 0?",
    rwCurrent: "Urashaka gusiba amafaranga yose no gutangira bushya?",
    rwSuggested: "Wizeye neza ko ushaka gusiba amateka yose y'amafaranga ukanatangira bushya kuri 0?",
    rwFinal: "",
    status: "Correct",
    notes: "Safety confirmation dialog"
  }
];

export const staffCatalog = [
  {
    id: "STAF-001",
    module: "Staff Management",
    element: "Page Title",
    en: "Staff & Cashier Management",
    rwCurrent: "Ubuyobozi bw'Abakozi",
    rwSuggested: "Gucunga abakozi n'abacuruza (Staff Management)",
    rwFinal: "",
    status: "Correct",
    notes: "Owner-only staff page"
  },
  {
    id: "STAF-002",
    module: "Staff Management",
    element: "Shop Code Card Title",
    en: "Your Shop Code",
    rwCurrent: "Kode ya shop yawe",
    rwSuggested: "Kode y'iduka ryawe (Shop Code)",
    rwFinal: "",
    status: "Correct",
    notes: "Displays shop code"
  },
  {
    id: "STAF-003",
    module: "Staff Management",
    element: "Copy Button",
    en: "Copy Code",
    rwCurrent: "Koporora",
    rwSuggested: "Koporora Kode",
    rwFinal: "",
    status: "Correct",
    notes: "Clipboard copy action"
  },
  {
    id: "STAF-004",
    module: "Staff Management",
    element: "Copy Success Toast",
    en: "Shop Code copied to clipboard!",
    rwCurrent: "Shop Code yakopiwemo neza!",
    rwSuggested: "Shop Code yakoporowe neza!",
    rwFinal: "",
    status: "Correct",
    notes: "Toast confirmation"
  },
  {
    id: "STAF-005",
    module: "Staff Management",
    element: "Primary Button",
    en: "Add New Cashier / Staff",
    rwCurrent: "Ongeraho Umukozi",
    rwSuggested: "Ongeraho umukozi mushya",
    rwFinal: "",
    status: "Correct",
    notes: "Opens cashier addition modal"
  },
  {
    id: "STAF-006",
    module: "Staff Management / Add Modal",
    element: "Input Label",
    en: "Staff Name *",
    rwCurrent: "Izina ry'umukozi *",
    rwSuggested: "Amazina y'umukozi *",
    rwFinal: "",
    status: "Correct",
    notes: "Staff name"
  },
  {
    id: "STAF-007",
    module: "Staff Management / Add Modal",
    element: "Input Label",
    en: "Phone Number *",
    rwCurrent: "Numero ya telefone *",
    rwSuggested: "Numero ya telefone *",
    rwFinal: "",
    status: "Correct",
    notes: "Phone field"
  },
  {
    id: "STAF-008",
    module: "Staff Management / Add Modal",
    element: "Role Dropdown Label",
    en: "Role",
    rwCurrent: "Inshingano",
    rwSuggested: "Inshingano z'akazi",
    rwFinal: "",
    status: "Correct",
    notes: "Role selection"
  },
  {
    id: "STAF-009",
    module: "Staff Management / Add Modal",
    element: "Role Option",
    en: "Cashier (POS & Sales only)",
    rwCurrent: "Cashier (Gucuruza gusa)",
    rwSuggested: "Kashiyeri (Gucuruza no kwakira amafaranga gusa)",
    rwFinal: "",
    status: "Correct",
    notes: "Cashier role description"
  },
  {
    id: "STAF-010",
    module: "Staff Management / Add Modal",
    element: "Role Option",
    en: "Manager (Full shop access except subscription)",
    rwCurrent: "Manager (Kureba byose uretse kwishyura)",
    rwSuggested: "Meneja (Ububiko, amadeni n'ubugenzuzi bwose)",
    rwFinal: "",
    status: "Correct",
    notes: "Manager role description"
  },
  {
    id: "STAF-011",
    module: "Staff Management / Table",
    element: "Status Badge Active",
    en: "Active",
    rwCurrent: "Arakora",
    rwSuggested: "Arakora (Active)",
    rwFinal: "",
    status: "Correct",
    notes: "Active badge"
  },
  {
    id: "STAF-012",
    module: "Staff Management / Table",
    element: "Status Badge Inactive",
    en: "Deactivated",
    rwCurrent: "Yarahagaritswe",
    rwSuggested: "Yarahagaritswe",
    rwFinal: "",
    status: "Correct",
    notes: "Inactive badge"
  },
  {
    id: "STAF-013",
    module: "Staff Management / Table",
    element: "Last Active Column",
    en: "Last Active",
    rwCurrent: "Yaherukaga gukora",
    rwSuggested: "Yaherukaga kugaragara",
    rwFinal: "",
    status: "Correct",
    notes: "Timestamp header"
  },
  {
    id: "STAF-014",
    module: "Staff Management / Table",
    element: "Last Active Value",
    en: "Active now",
    rwCurrent: "Arakora ubu (Active now)",
    rwSuggested: "Ari gukora ubu",
    rwFinal: "",
    status: "Needs correction",
    notes: "Removes English '(Active now)' from Kinyarwanda view"
  },
  {
    id: "STAF-015",
    module: "Staff Management / Table",
    element: "Last Active Value",
    en: "Never logged in",
    rwCurrent: "Ntarinjira",
    rwSuggested: "Ntarinjira na rimwe",
    rwFinal: "",
    status: "Correct",
    notes: "Unclaimed cashier account"
  },
  {
    id: "STAF-016",
    module: "Staff Management / Actions",
    element: "Reset PIN Button",
    en: "Reset PIN",
    rwCurrent: "Hindura PIN",
    rwSuggested: "Guhindura PIN",
    rwFinal: "",
    status: "Correct",
    notes: "Triggers PIN reset modal"
  },
  {
    id: "STAF-017",
    module: "Staff Management / Reset Modal",
    element: "Modal Title",
    en: "Reset Cashier PIN for {name}",
    rwCurrent: "Guhindura PIN ya {name}",
    rwSuggested: "Guhindurira PIN umukozi {name}",
    rwFinal: "",
    status: "Correct",
    notes: "Modal heading"
  },
  {
    id: "STAF-018",
    module: "Staff Management / Reset Modal",
    element: "Input Label",
    en: "New 4-Digit Security PIN *",
    rwCurrent: "PIN nshya y'imibare 4 *",
    rwSuggested: "PIN nshya y'imibare 4 *",
    rwFinal: "",
    status: "Correct",
    notes: "New PIN input"
  },
  {
    id: "STAF-019",
    module: "Staff Management / Reset Modal",
    element: "Warning Note",
    en: "Existing active sessions on the cashier's phone will be revoked immediately.",
    rwCurrent: "Telefone ye izasohorwa ako kanya asabwe gukoresha iyi PIN nshya.",
    rwSuggested: "Telefone ye izasohorwa ako kanya asabwe gukoresha iyi PIN nshya.",
    rwFinal: "",
    status: "Correct",
    notes: "Security consequence"
  },
  {
    id: "STAF-020",
    module: "Staff Management / Actions",
    element: "Revoke Session Button",
    en: "Revoke Session Immediately",
    rwCurrent: "Sohora ako kanya",
    rwSuggested: "Gusohora umukozi ako kanya (Revoke Session)",
    rwFinal: "",
    status: "Correct",
    notes: "Emergency logout action"
  },
  {
    id: "STAF-021",
    module: "Staff Management / Actions",
    element: "Toggle Status Button",
    en: "Deactivate Cashier",
    rwCurrent: "Hagarika konti",
    rwSuggested: "Guhagarika konti y'umukozi",
    rwFinal: "",
    status: "Correct",
    notes: "Deactivation trigger"
  }
];

export const settingsCatalog = [
  {
    id: "SETT-001",
    module: "Settings / More Hub",
    element: "Page Header",
    en: "Settings & Tools",
    rwCurrent: "Ibindi",
    rwSuggested: "Igenamiterere n'Ibindi bikoresho",
    rwFinal: "",
    status: "Needs correction",
    notes: "'Ibindi' is generic ('More/Other'); 'Igenamiterere n'ibindi bikoresho' is clear and professional."
  },
  {
    id: "SETT-002",
    module: "Settings / Hub Item",
    element: "Row Title",
    en: "Account & Security PIN",
    rwCurrent: "Konti & PIN",
    rwSuggested: "Konti & Umutekano wa PIN",
    rwFinal: "",
    status: "Correct",
    notes: "Navigates to account profile"
  },
  {
    id: "SETT-003",
    module: "Settings / Hub Item",
    element: "Row Subtitle",
    en: "Profile, change PIN, delete account",
    rwCurrent: "Umwirondoro, guhindura PIN, gusiba",
    rwSuggested: "Umwirondoro w'iduka, guhindura PIN",
    rwFinal: "",
    status: "Correct",
    notes: "Summary hint"
  },
  {
    id: "SETT-004",
    module: "Settings / Hub Item",
    element: "Row Title",
    en: "Receipt & Printing Settings",
    rwCurrent: "Igenamiterere ya resi",
    rwSuggested: "Igenamiterere rya resi no gucapa",
    rwFinal: "",
    status: "Correct",
    notes: "Opens receipt configuration"
  },
  {
    id: "SETT-005",
    module: "Settings / Hub Item",
    element: "Row Subtitle",
    en: "Thermal printer (80mm/58mm), PDF, WhatsApp",
    rwCurrent: "PDF, printinga, WhatsApp — byose ni optional",
    rwSuggested: "Gucapa kuri thermal printer, PDF, na WhatsApp",
    rwFinal: "",
    status: "Needs correction",
    notes: "Replaces 'printinga' with 'gucapa'"
  },
  {
    id: "SETT-006",
    module: "Settings / Hub Item",
    element: "Row Title",
    en: "Language / Ururimi",
    rwCurrent: "Ururimi (Kinyarwanda / English)",
    rwSuggested: "Ururimi (Kinyarwanda / English)",
    rwFinal: "",
    status: "Correct",
    notes: "Language switcher"
  },
  {
    id: "SETT-007",
    module: "Settings / Hub Item",
    element: "Row Title",
    en: "Install App on Phone",
    rwCurrent: "Shyira app kuri téléphone",
    rwSuggested: "Kwinjiza app kuri telefone (Install PWA)",
    rwFinal: "",
    status: "Correct",
    notes: "PWA installation"
  },
  {
    id: "SETT-008",
    module: "Settings / Hub Item",
    element: "Row Title",
    en: "Billing & Subscription",
    rwCurrent: "Kwishyura / Plan",
    rwSuggested: "Kwishyura ifatabuguzi (Subscription)",
    rwFinal: "",
    status: "Correct",
    notes: "Opens billing management"
  },
  {
    id: "SETT-009",
    module: "Settings / Receipt",
    element: "Toggle Label",
    en: "Show Shop Logo on Receipt",
    rwCurrent: "Erekana ikirango cya shop kuri resi",
    rwSuggested: "Erekana ikirango cy'iduka kuri resi",
    rwFinal: "",
    status: "Needs correction",
    notes: "'shop' to 'iduka'"
  },
  {
    id: "SETT-010",
    module: "Settings / Receipt",
    element: "Input Label",
    en: "Custom Receipt Header Message",
    rwCurrent: "Ubutumwa bwo hejuru kuri resi",
    rwSuggested: "Ubutumwa bwo hejuru kuri resi",
    rwFinal: "",
    status: "Correct",
    notes: "Header text"
  },
  {
    id: "SETT-011",
    module: "Settings / Receipt",
    element: "Input Label",
    en: "Custom Receipt Footer / Thank You Note",
    rwCurrent: "Ubutumwa bwo hasi (Gushimira)",
    rwSuggested: "Ubutumwa bwo hasi bwo gushimira umukiriya",
    rwFinal: "",
    status: "Correct",
    notes: "Footer text"
  },
  {
    id: "SETT-012",
    module: "Settings / Receipt",
    element: "Radio Option",
    en: "Thermal Printer (58mm)",
    rwCurrent: "Thermal printer (58mm)",
    rwSuggested: "Thermal printer ntoya (58mm)",
    rwFinal: "",
    status: "Correct",
    notes: "Printer paper size"
  },
  {
    id: "SETT-013",
    module: "Settings / Receipt",
    element: "Radio Option",
    en: "Thermal Printer (80mm)",
    rwCurrent: "Thermal printer ngari (80mm)",
    rwSuggested: "Thermal printer nini (80mm)",
    rwFinal: "",
    status: "Correct",
    notes: "Printer paper size"
  }
];

export const subscriptionCatalog = [
  {
    id: "SUBS-001",
    module: "Subscription & Billing",
    element: "Page Header",
    en: "Subscription & Plans",
    rwCurrent: "Kwishyura / Plan",
    rwSuggested: "Ifatabuguzi n'Ibiciro bya Sella",
    rwFinal: "",
    status: "Correct",
    notes: "Top header"
  },
  {
    id: "SUBS-002",
    module: "Subscription & Billing",
    element: "Status Badge Active",
    en: "Active Subscription",
    rwCurrent: "Ifatabuguzi rirakora",
    rwSuggested: "Ifatabuguzi rirakora neza",
    rwFinal: "",
    status: "Correct",
    notes: "Status pill"
  },
  {
    id: "SUBS-003",
    module: "Subscription & Billing",
    element: "Status Badge Expired",
    en: "Subscription Expired",
    rwCurrent: "Ifatabuguzi ryarangiye",
    rwSuggested: "Ifatabuguzi ryarangiye",
    rwFinal: "",
    status: "Correct",
    notes: "Status pill"
  },
  {
    id: "SUBS-004",
    module: "Subscription & Billing",
    element: "WriteGate Banner",
    en: "Subscription expired — please renew to continue creating sales, editing stock and managing debt.",
    rwCurrent: "Subscription yarangiye — jya kuri Billing wishyure kugira ngo ukomeze",
    rwSuggested: "Ifatabuguzi ryarangiye — fungura Billing wishyure kugira ngo ukomeze gucuruza no kubika amakuru.",
    rwFinal: "",
    status: "Needs correction",
    notes: "Standardizes 'Subscription' to 'Ifatabuguzi'"
  },
  {
    id: "SUBS-005",
    module: "Subscription & Billing",
    element: "Plan Card Title",
    en: "Pro Shop Plan",
    rwCurrent: "Pro Plan",
    rwSuggested: "Gahunda y'Ubucuruzi (Pro Plan)",
    rwFinal: "",
    status: "Correct",
    notes: "Plan name"
  },
  {
    id: "SUBS-006",
    module: "Subscription & Billing",
    element: "Billing Interval Option",
    en: "Monthly (RWF 5,000 / month)",
    rwCurrent: "Kuri buri kwezi (5,000 FRW / ukwezi)",
    rwSuggested: "Buri kwezi (5,000 FRW ku kwezi)",
    rwFinal: "",
    status: "Correct",
    notes: "Monthly option"
  },
  {
    id: "SUBS-007",
    module: "Subscription & Billing",
    element: "Billing Interval Option",
    en: "Annual (Save 20% · RWF 48,000 / year)",
    rwCurrent: "Ku mwaka (Zigama 20% · 48,000 FRW / umwaka)",
    rwSuggested: "Ku mwaka wose (Zigama 20% · 48,000 FRW)",
    rwFinal: "",
    status: "Correct",
    notes: "Annual discount"
  },
  {
    id: "SUBS-008",
    module: "Subscription & Billing",
    element: "Payment Method Button",
    en: "Pay with MTN Mobile Money",
    rwCurrent: "Ishyura na MTN MoMo",
    rwSuggested: "Kwishyura ukoresheje MTN MoMo",
    rwFinal: "",
    status: "Correct",
    notes: "USSD prompt trigger"
  },
  {
    id: "SUBS-009",
    module: "Subscription & Billing",
    element: "Payment Method Button",
    en: "Pay with Airtel Money",
    rwCurrent: "Ishyura na Airtel Money",
    rwSuggested: "Kwishyura ukoresheje Airtel Money",
    rwFinal: "",
    status: "Correct",
    notes: "Airtel trigger"
  }
];

export const notificationsCatalog = [
  {
    id: "NOTIF-001",
    module: "Notifications / Inbox",
    element: "Page Title",
    en: "Inbox & Notifications",
    rwCurrent: "Ubutumwa",
    rwSuggested: "Ubutumwa n'integuza",
    rwFinal: "",
    status: "Correct",
    notes: "Page title"
  },
  {
    id: "NOTIF-002",
    module: "Notifications / Inbox",
    element: "Empty State Title",
    en: "No new notifications",
    rwCurrent: "Nta butumwa bushya buhari",
    rwSuggested: "Nta butumwa bushya buhari",
    rwFinal: "",
    status: "Correct",
    notes: "Empty inbox"
  },
  {
    id: "NOTIF-003",
    module: "System Messages / Toasts",
    element: "Success Toast",
    en: "Sale recorded successfully!",
    rwCurrent: "Igurisha ryanditswe neza",
    rwSuggested: "Igurisha ryanditswe neza!",
    rwFinal: "",
    status: "Correct",
    notes: "Order creation"
  },
  {
    id: "NOTIF-004",
    module: "System Messages / Toasts",
    element: "Success Toast",
    en: "Debt recorded successfully!",
    rwCurrent: "Ideni ryanditswe neza",
    rwSuggested: "Ideni ryanditswe neza!",
    rwFinal: "",
    status: "Correct",
    notes: "Debt creation"
  },
  {
    id: "NOTIF-005",
    module: "System Messages / Toasts",
    element: "Success Toast",
    en: "Marked as paid!",
    rwCurrent: "Byanditswe ko byishyuwe",
    rwSuggested: "Byanditswe ko byishyuwe neza!",
    rwFinal: "",
    status: "Correct",
    notes: "Payment confirmation"
  },
  {
    id: "NOTIF-006",
    module: "System Messages / Toasts",
    element: "Error Toast",
    en: "Invalid PIN entered",
    rwCurrent: "PIN ntiyemewe",
    rwSuggested: "PIN ntiyemewe. Ongera ugerageze.",
    rwFinal: "",
    status: "Correct",
    notes: "PIN failure"
  },
  {
    id: "NOTIF-007",
    module: "System Messages / Toasts",
    element: "Error Toast",
    en: "An unexpected error occurred",
    rwCurrent: "Habaye ikosa",
    rwSuggested: "Habaye ikosa ritunguranye. Ongera ugerageze.",
    rwFinal: "",
    status: "Correct",
    notes: "Generic error handler"
  },
  {
    id: "NOTIF-008",
    module: "System Messages / Toasts",
    element: "Error Toast",
    en: "Insufficient inventory stock for this sale",
    rwCurrent: "Ntabwo bihagije mu bubiko",
    rwSuggested: "Ibicuruzwa biri mu bubiko ntabwo bihagije",
    rwFinal: "",
    status: "Correct",
    notes: "Stock quantity validation"
  }
];

export const pdfCatalog = [
  {
    id: "PDF-001",
    module: "Generated Documents / Invoice",
    element: "Document Badge / Title",
    en: "Invoice",
    rwCurrent: "Fakitire",
    rwSuggested: "Fakitire",
    rwFinal: "",
    status: "Correct",
    notes: "Standard invoice header"
  },
  {
    id: "PDF-002",
    module: "Generated Documents / Receipt",
    element: "Document Badge / Title",
    en: "Payment Receipt",
    rwCurrent: "Resi",
    rwSuggested: "Resi y'Ubwishyu",
    rwFinal: "",
    status: "Correct",
    notes: "Standard receipt header"
  },
  {
    id: "PDF-003",
    module: "Generated Documents / Statement",
    element: "Document Badge / Title",
    en: "Debtors Statement",
    rwCurrent: "Inyandiko y'Abadenyi",
    rwSuggested: "Inyandiko y'Amadeni y'Umukiriya",
    rwFinal: "",
    status: "Needs correction",
    notes: "'Abadenyi' has pejorative tone; 'Inyandiko y'amadeni' is professional and courteous."
  },
  {
    id: "PDF-004",
    module: "Generated Documents / Report",
    element: "Document Badge / Title",
    en: "All Debts Summary Report",
    rwCurrent: "Raporo y'Ideni",
    rwSuggested: "Raporo y'Amadeni Yose Atarishyurwa",
    rwFinal: "",
    status: "Needs correction",
    notes: "Singular 'Ideni' is replaced with comprehensive 'Amadeni yose atarishyurwa'."
  },
  {
    id: "PDF-005",
    module: "Generated Documents / Meta",
    element: "Recipient Field",
    en: "Bill To",
    rwCurrent: "Ku mukiriya",
    rwSuggested: "Yateguriwe umukiriya",
    rwFinal: "",
    status: "Correct",
    notes: "Customer section"
  },
  {
    id: "PDF-006",
    module: "Generated Documents / Meta",
    element: "Sender Field",
    en: "From",
    rwCurrent: "Kuva",
    rwSuggested: "Itanzwe na (Iduka)",
    rwFinal: "",
    status: "Correct",
    notes: "Merchant section"
  },
  {
    id: "PDF-007",
    module: "Generated Documents / Table",
    element: "Table Column",
    en: "Description",
    rwCurrent: "Ibisobanuro",
    rwSuggested: "Izina ry'ikicuruzwa / Ibisobanuro",
    rwFinal: "",
    status: "Correct",
    notes: "Line items header"
  },
  {
    id: "PDF-008",
    module: "Generated Documents / Table",
    element: "Table Column",
    en: "Qty",
    rwCurrent: "Ingano",
    rwSuggested: "Ingano (Qty)",
    rwFinal: "",
    status: "Correct",
    notes: "Quantity header"
  },
  {
    id: "PDF-009",
    module: "Generated Documents / Table",
    element: "Table Column",
    en: "Unit Price",
    rwCurrent: "Igiciro",
    rwSuggested: "Igiciro kuri kimwe",
    rwFinal: "",
    status: "Correct",
    notes: "Unit price header"
  },
  {
    id: "PDF-010",
    module: "Generated Documents / Table",
    element: "Table Column",
    en: "Amount",
    rwCurrent: "Amafaranga",
    rwSuggested: "Igiteranyo",
    rwFinal: "",
    status: "Correct",
    notes: "Line total"
  },
  {
    id: "PDF-011",
    module: "Generated Documents / Totals",
    element: "Totals Row",
    en: "Subtotal",
    rwCurrent: "Igiteranyo",
    rwSuggested: "Igiteranyo cy'agateganyo",
    rwFinal: "",
    status: "Correct",
    notes: "Subtotal"
  },
  {
    id: "PDF-012",
    module: "Generated Documents / Totals",
    element: "Totals Row",
    en: "Tax (0%)",
    rwCurrent: "Umusoro (0%)",
    rwSuggested: "Umusoro (0%)",
    rwFinal: "",
    status: "Correct",
    notes: "Exempt tax line"
  },
  {
    id: "PDF-013",
    module: "Generated Documents / Totals",
    element: "Totals Row",
    en: "Total Amount Due",
    rwCurrent: "Byose",
    rwSuggested: "Igiteranyo cyose hamwe",
    rwFinal: "",
    status: "Needs correction",
    notes: "'Byose' literally means 'Everything'. In accounting totals, 'Igiteranyo cyose' is standard."
  },
  {
    id: "PDF-014",
    module: "Generated Documents / Totals",
    element: "Totals Row",
    en: "Paid",
    rwCurrent: "Yishyuwe",
    rwSuggested: "Ayishyuwe",
    rwFinal: "",
    status: "Correct",
    notes: "Paid amount"
  },
  {
    id: "PDF-015",
    module: "Generated Documents / Totals",
    element: "Totals Row",
    en: "Remaining Balance",
    rwCurrent: "Asigaye",
    rwSuggested: "Asigaye kwishyurwa",
    rwFinal: "",
    status: "Correct",
    notes: "Remaining balance"
  },
  {
    id: "PDF-016",
    module: "Generated Documents / Financial Summary",
    element: "Summary Metric",
    en: "Debtor Count",
    rwCurrent: "Umubare w'abadenyi",
    rwSuggested: "Umubare w'abafite amadeni",
    rwFinal: "",
    status: "Needs correction",
    notes: "'Abadenyi' has pejorative tone; replace with respectful 'abafite amadeni'."
  },
  {
    id: "PDF-017",
    module: "Generated Documents / Financial Summary",
    element: "Summary Metric",
    en: "Average Balance",
    rwCurrent: "Ideni risanzwe",
    rwSuggested: "Ideni rigereranyije",
    rwFinal: "",
    status: "Needs correction",
    notes: "'Ideni risanzwe' mistranslates average debt as 'ordinary debt'. 'Ideni rigereranyije' is mathematically correct."
  },
  {
    id: "PDF-018",
    module: "Generated Documents / Footer",
    element: "Thank You Note",
    en: "Thank you for choosing {shop}.",
    rwCurrent: "Murakoze kugana {shop}.",
    rwSuggested: "Murakoze guhitamo no kugana {shop}.",
    rwFinal: "",
    status: "Correct",
    notes: "Closing remark"
  },
  {
    id: "PDF-019",
    module: "Generated Documents / Footer",
    element: "Pagination",
    en: "Page {n} of {total}",
    rwCurrent: "Urupapuro {n} kuri {total}",
    rwSuggested: "Urupapuro rwa {n} kuri {total}",
    rwFinal: "",
    status: "Correct",
    notes: "Pagination footer"
  },
  {
    id: "PDF-020",
    module: "Generated Documents / Thermal",
    element: "Thermal Receipt Header",
    en: "OFFICIAL RETAIL RECEIPT",
    rwCurrent: "RESI Y'UBWISHYU",
    rwSuggested: "RESI Y'UBWISHYU",
    rwFinal: "",
    status: "Correct",
    notes: "Thermal print slip header"
  }
];

export const miscAndMarketingCatalog = [
  {
    id: "MISC-001",
    module: "Navigation",
    element: "Bottom Nav Tab",
    en: "Home",
    rwCurrent: "Ahabanza",
    rwSuggested: "Ahabanza",
    rwFinal: "",
    status: "Correct",
    notes: "Tab 1"
  },
  {
    id: "MISC-002",
    module: "Navigation",
    element: "Bottom Nav Tab",
    en: "Debts",
    rwCurrent: "Ideni",
    rwSuggested: "Amadeni",
    rwFinal: "",
    status: "Needs correction",
    notes: "Plural 'Amadeni' for customer debts tab"
  },
  {
    id: "MISC-003",
    module: "Navigation",
    element: "Bottom Nav Tab",
    en: "Sales",
    rwCurrent: "Amafaranga",
    rwSuggested: "Raporo",
    rwFinal: "",
    status: "Correct",
    notes: "Tab 3"
  },
  {
    id: "MISC-004",
    module: "Navigation",
    element: "Bottom Nav Tab",
    en: "Stock",
    rwCurrent: "Ububiko",
    rwSuggested: "Ububiko",
    rwFinal: "",
    status: "Correct",
    notes: "Tab 4"
  },
  {
    id: "MISC-005",
    module: "Navigation",
    element: "Bottom Nav Tab",
    en: "More",
    rwCurrent: "Ibindi",
    rwSuggested: "Ibindi",
    rwFinal: "",
    status: "Correct",
    notes: "Tab 5"
  },
  {
    id: "MISC-006",
    module: "Assistant / ChatSella",
    element: "Page Title",
    en: "Ask ChatSella",
    rwCurrent: "ChatSella",
    rwSuggested: "ChatSella — Umufasha mu bucuruzi",
    rwFinal: "",
    status: "Correct",
    notes: "AI assistant interface"
  },
  {
    id: "MISC-007",
    module: "Assistant / ChatSella",
    element: "Input Placeholder",
    en: "Ask ChatSella... e.g. How much did we collect today?",
    rwCurrent: "Baza ChatSella… urugero: Amafaranga yinjiye uyu munsi?",
    rwSuggested: "Baza ChatSella… urugero: Amafaranga yinjiye uyu munsi?",
    rwFinal: "",
    status: "Correct",
    notes: "AI prompt input"
  },
  {
    id: "MISC-008",
    module: "Marketing / Landing",
    element: "Hero Title",
    en: "Smart, Simple Retail POS for Rwandan Shopkeepers",
    rwCurrent: "Sella — POS yoroshye kandi yizewe ku bucuruzi bwo mu Rwanda",
    rwSuggested: "Sella — POS yoroshye kandi yizewe ku bucuruzi bwo mu Rwanda",
    rwFinal: "",
    status: "Missing translation",
    notes: "Marketing landing page currently renders in English; Kinyarwanda copy recommended"
  },
  {
    id: "MISC-009",
    module: "Marketing / Pricing",
    element: "Section Title",
    en: "Affordable Pricing Built for Real Rwandan Businesses",
    rwCurrent: "Affordable Pricing Built for Real Rwandan Businesses",
    rwSuggested: "Ibiciro bibereye buri mucuruzi mu Rwanda",
    rwFinal: "",
    status: "Missing translation",
    notes: "Source-only / English marketing page"
  },
  {
    id: "MISC-010",
    module: "Legal / Terms",
    element: "Page Title",
    en: "Terms of Service",
    rwCurrent: "Amategeko n'amabwiriza yo gukoresha Sella",
    rwSuggested: "Amategeko n'amabwiriza yo gukoresha Sella",
    rwFinal: "",
    status: "Correct",
    notes: "Legal terms"
  },
  {
    id: "MISC-011",
    module: "Legal / Privacy",
    element: "Page Title",
    en: "Privacy Policy",
    rwCurrent: "Politiki y'amabanga n'umutekano w'amakuru",
    rwSuggested: "Politiki y'amabanga n'umutekano w'amakuru",
    rwFinal: "",
    status: "Correct",
    notes: "Privacy policy"
  }
];

export const allModules = [
  { name: "Authentication", catalog: authCatalog },
  { name: "Dashboard", catalog: dashboardCatalog },
  { name: "Sales", catalog: salesCatalog },
  { name: "Inventory", catalog: inventoryCatalog },
  { name: "Clients", catalog: clientsCatalog },
  { name: "Debts", catalog: debtsCatalog },
  { name: "Payments", catalog: paymentsCatalog },
  { name: "Reports", catalog: reportsCatalog },
  { name: "Staff", catalog: staffCatalog },
  { name: "Settings", catalog: settingsCatalog },
  { name: "Subscription", catalog: subscriptionCatalog },
  { name: "Notifications & System", catalog: notificationsCatalog },
  { name: "PDFs & Documents", catalog: pdfCatalog },
  { name: "Other / Unclassified", catalog: miscAndMarketingCatalog },
];
