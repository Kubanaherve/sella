/** Kinyarwanda-first copy for shopkeeper UI. Keep short and natural for retail. */
export const labels = {
  // Auth & Navigation
  login: "Injira",
  logout: "Sohoka",
  pin: "PIN",
  name: "Izina",
  welcome: "Murakaza neza",
  home: "Ahabanza",
  debtsTab: "Ideni",
  salesTab: "Amafaranga",
  stockTab: "Ububiko",
  moreTab: "Ibindi",
  newSale: "Igurisha rishya",
  viewSales: "Reba amafaranga",
  quickActions: "Ibikorwa byihuse",
  back: "Subira",
  more: "Ibindi",

  // Dashboard
  dashboard: "Ahabanza",
  addDebt: "Igurisha rishya",
  debtList: "Ideni",
  salesTracking: "Raporo y'amafaranga",
  inventoryTitle: "Ububiko",
  inventorySubtitle: "Ibicuruzwa biri mu bubiko",
  addInventoryItem: "Ongeraho ikicuruzwa",
  noInventory: "Nta kicuruzwa kihari",
  totalUnpaid: "Ideni ritarishyurwa",
  moneyInToday: "Amafaranga yinjiye uyu munsi",
  moneyInWeek: "Amafaranga yinjiye iki cyumweru",
  today: "Uyu munsi",
  week: "Icyumweru",
  salesValue: "Agaciro k'ibicuruzwa",
  creditToday: "Ideni ryatanzwe uyu munsi",
  creditWeek: "Ideni ryatanzwe iki cyumweru",
  goodMorning: "Mwaramutse",
  goodAfternoon: "Mwiriwe",
  goodEvening: "Muramuke",

  // Customer & Debt Fields
  customerName: "Izina ry'umukiriya",
  phoneNumber: "Numero ya telefone",
  itemsTaken: "Ibicuruzwa byafashwe",
  amount: "Amafaranga",
  dueDate: "Itariki yo kwishyura",
  dateTaken: "Itariki yo gufata",
  paymentStatus: "Imiterere y'ubwishyu",
  willPayLater: "Azishyura nyuma",
  paid: "Yishyuye",
  unpaid: "Ntarishyura",
  partial: "Yishyuye igice",
  credit: "Ideni",
  inbox: "Ubutumwa",

  // Sales Fields
  itemName: "Izina ry'ikicuruzwa",
  costPrice: "Igiciro cyo kurangura",
  salePrice: "Igiciro cyo kugurisha",
  quantity: "Umubare",
  dateSold: "Itariki byagurishijweho",
  dateBought: "Itariki byaguzweho",
  cart: "Agatebo",
  checkout: "Kwishyura",
  subtotal: "Igiteranyo",
  discount: "Kugabanya",
  total: "Igiteranyo cyose",
  payingNow: "Arishyura nonaha",
  balanceDue: "Asigaye / ideni",
  changeDue: "Amafaranga yo gusubiza",
  searchProducts: "Shakisha ibicuruzwa…",
  allCategories: "Byose",
  noProducts: "Nta bicuruzwa byabonetse",
  addStock: "Ongeraho mu bubiko",
  outOfStock: "Byashize mu bubiko",
  notEnoughStock: "Ntabwo bihagije mu bubiko",
  customerRequired: "Andika izina ry'umukiriya (hari ideni)",
  saleRecorded: "Igurisha ryanditswe",
  saleFailed: "Igurisha ntiryagenze neza",
  saving: "Birimo kubikwa…",
  confirmPay: "Emeza",
  cash: "Cash",
  momo: "MTN MoMo",
  airtel: "Airtel Money",
  bank: "Banki",

  // Actions
  save: "Bika",
  cancel: "Hagarika",
  addNew: "Ongeraho ikindi",
  delete: "Siba",
  edit: "Hindura",
  call: "Hamagara",
  sendMessage: "Ohereza ubutumwa",
  markAsPaid: "Andika ko yishyuye",
  remind: "Ibuka / ohereza ubutumwa",
  filter: "Tondeka",
  search: "Shakisha",
  ok: "Yego",
  confirm: "Emeza",
  finish: "Rangiza",
  print: "Printinga",
  receipt: "Resi",

  // Summary
  totalSales: "Amafaranga yose yinjiye",
  totalProfit: "Igiteranyo cy'inyungu",
  totalDebt: "Ideni ryose",
  customers: "Abakiriya",
  moneyCollected: "Amafaranga yakiriwe",
  stillOwed: "Akiri ku ideni",
  recentSales: "Igurisha rya vuba",

  // Messages / toasts
  debtSavedSuccess: "Ideni ryanditswe neza",
  saleSavedSuccess: "Igurisha ryanditswe neza",
  markedAsPaid: "Byanditswe ko byishyuwe",
  confirmDelete: "Urashaka gusiba?",
  confirmResetAll: "Urashaka gusiba amafaranga yose no gutangira bushya?",
  resetAll: "Tangira bushya",
  resetSuccess: "Amafaranga yasubijwe kuri 0!",
  noDebts: "Nta deni rihari",
  noSales: "Nta kintu cyagurishijwe",
  invalidPin: "PIN ntiyemewe",
  couldNotLoadStats: "Ntibashoboye kubona imibare",
  subscriptionExpired:
    "Subscription yarangiye — jya kuri Billing wishyure kugira ngo ukomeze",
  renewWithMomo: "Ongera wishyure na MoMo →",
  writeRequiresSub: "bisaba subscription ikora",
  openBilling: "Fungura Billing →",
  renewMoMoMonth: (price: string) =>
    `Ongera wishyure RWF ${price}/ukwezi na MTN MoMo.`,

  // More / settings
  moreTitle: "Ibindi",
  moreSubtitle: "Ibikoresho n'igenamiterere ya shop",
  clientsRow: "Abakiriya",
  clientsHint: "Urutonde rw'abakiriya",
  inboxRow: "Ubutumwa",
  inboxHint: "Kwibutsa abafite ideni",
  billingRow: "Kwishyura / Plan",
  accountRow: "Konti & PIN",
  accountHint: "Umwirondoro, guhindura PIN, gusiba",
  receiptRow: "Igenamiterere ya resi",
  receiptHint: "PDF, printinga, WhatsApp — byose ni optional",
  installRow: "Shyira app kuri téléphone",
  installHint: "Ongeraho ku screen y'ibanze",
  importRow: "Kuzana abakiriya",
  importHint: "Import ya JSON",
  importInventoryRow: "Kuzana ububiko (CSV/Excel)",
  importInventoryHint: "Amashami menshi · map columns · preview",
  assistantRow: "Ask ChatSella",
  assistantHint: "Baza ChatSella mu Kinyarwanda ku bijyanye na shop yawe",
  signOut: "Sohoka",
  madeForRwanda: "Sella · yakorewe ubucuruzi mu Rwanda",

  // Sale complete
  saleCompleted: "Igurisha ryarangiye",
  received: "Byakiriwe",
  balance: "Asigaye",
  statusPaid: "YISHYUYE",
  statusPartial: "IGICE",
  statusCredit: "IDENI",

  // Assistant
  assistantTitle: "ChatSella",
  assistantSubtitle: "Ask ChatSella — subiza mu Kinyarwanda hashingiye ku makuru ya shop yawe",
  assistantPlaceholder: "Baza ChatSella… urugero: Amafaranga yinjiye uyu munsi?",
  assistantThinking: "ChatSella irimo gusubiza…",
  assistantSend: "Ohereza",
  assistantWelcome:
    "Muraho! Ndi ChatSella. Mbaza ku bijyanye n'amafaranga, ideni, ububiko, cyangwa uko wakoresha app. Andika ikibazo mu Kinyarwanda.",

  // App Info
  appName: "Sella",
  businessTagline: "Ubucuruzi bwawe",
} as const;

/** @deprecated use labels.inbox */
export const Inbox = labels.inbox;

// SMS message templates
export const smsTemplates = {
  debtConfirmation: (items: string, amount: string) =>
    `Muraho, mwafashe ${items}. Amafaranga muzishyura ni ${amount} FRW. Murakoze cyane!`,

  debtReminder: (items: string, amount: string, dueDate?: string) =>
    [
      "Muraho mukiliya mwiza twifuzaga kubibutsa ko mufite mwafashe ibi bintu bikurikira",
      items.startsWith("(") ? items : `(${items} )`,
      `Amafaranga: ${amount}${dueDate ? ` · Azishyura: ${dueDate}` : ""}`,
      "nimubone umwanya murebe PDF twabahaye muze kuyigenderaho mwishyura.",
      "Turabashimiye cyane!",
    ].join("\n"),

  cashAcknowledgment: (amount: string, method: string, remaining: string) =>
    `Murakoze cyane! Twakiriye ${amount} FRW (${method}). Asigaye: ${remaining} FRW. Sella.`,

  paymentReceipt: (
    receiptId: string,
    amount: string,
    method: string,
    clientName: string,
    remaining: string
  ) =>
    `Resi #${receiptId}: Twakiriye ${amount} FRW (${method}) kuva kuri ${clientName}. Asigaye: ${remaining} FRW. Murakoze gukoresha Sella!`,
};

export const formatCurrency = (amount: number): string => {
  return (
    new Intl.NumberFormat("rw-RW", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " FRW"
  );
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-RW", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
