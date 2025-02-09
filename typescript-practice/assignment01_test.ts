// 輸入內容

// BillInput 表示一筆帳單的輸入資料
type BillInput = {
    date: string; // 帳單日期
    location: string; // 帳單地點
    tipPercentage: number; // 小費百分比
    items: BillItem[]; // 帳單項目，包含多個 BillItem
}

// BillItem 可以是共用的或個人的帳單項目
type BillItem = SharedBillItem | PersonalBillItem;

// CommonBillItem 表示所有帳單項目的共同屬性
type CommonBillItem = {
    price: number; // 項目的價格
    name: string; // 項目的名稱
}

// SharedBillItem 表示共用的帳單項目，isShared 為 true
type SharedBillItem = CommonBillItem & {
    isShared: true; // 表示該項目是共用的
}

// PersonalBillItem 表示個人的帳單項目，isShared 為 false
type PersonalBillItem = CommonBillItem & {
    isShared: false; // 表示該項目是個人的
    person: string; // 記錄此項目的擁有者
}

// 輸出內容

// BillOutput 表示一筆帳單的輸出資料
type BillOutput = {
    date: string; // 帳單日期
    location: string; // 帳單地點
    subTotal: number; // 商品小計金額
    tip: number; // 小費金額
    totalAmount: number; // 總金額（小計 + 小費）
    items: PersonItem[]; // 每個人的帳單項目，包含多個 PersonItem
}

// PersonItem 表示每個人對應的帳單項目
type PersonItem = {
    name: string; // 人的姓名
    amount: number; // 此人需支付的金額
}

// 核心函數

// 主函數，將帳單拆分為個別支付金額
function splitBill(input: BillInput): BillOutput {
    let date = formatDate(input.date); // 格式化日期
    let location = input.location; // 獲取地點
    let subTotal = calculateSubTotal(input.items); // 計算商品小計
    let tip = calculateTip(subTotal, input.tipPercentage); // 計算小費
    let totalAmount = subTotal + tip; // 計算總金額
    let items = calculateItems(input.items); // 計算每個人的金額

    // 返回格式化的帳單輸出
    return {
        date,
        location,
        subTotal,
        tip,
        totalAmount,
        items,
    };
}

// 格式化日期，將輸入日期格式從 YYYY-MM-DD 轉換為 YYYY年M月D日
function formatDate(date: string): string {
    const parts = date.split('-');
    return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`;
}

// 計算所有項目的小計，返回價格總和
function calculateSubTotal(items: BillItem[]): number {
    return items.reduce((sum, item) => sum + item.price, 0);
}

// 計算小費，根據小計和小費百分比進行計算，並四捨五入到最近的 10 分錢
function calculateTip(subTotal: number, tipPercentage: number): number {
    const tip = subTotal * (tipPercentage / 100);
    return Math.round(tip * 10) / 10; // 四捨五入到最近的 10 分錢
}

// 從項目中掃描出所有人的姓名，返回姓名列表
function scanPersons(items: BillItem[]): string[] {
    const persons = new Set<string>();
    items.forEach(item => {
        if (!item.isShared && item.person) {
            persons.add(item.person);
        }
    });
    return Array.from(persons);
}

// 根據每個人的姓名計算各自的帳單項目金額
function calculateItems(items: BillItem[]): PersonItem[] {
    const names = scanPersons(items); // 獲取所有人的姓名
    const personsCount = names.length; // 計算人數

    return names.map(name => ({
        name,
        amount: calculatePersonAmount({
            items,
            name,
            personsCount,
        }),
    }));
}

// 計算每個人的金額
function calculatePersonAmount(input: {
    items: BillItem[]; // 帳單項目
    name: string; // 人的姓名
    personsCount: number; // 總人數
}): number {
    let totalAmount = 0;

    input.items.forEach(item => {
        if (item.isShared) {
            totalAmount += item.price / input.personsCount; // 把共用項目均分
        } else if (item.person === input.name) {
            totalAmount += item.price; // 個人項目直接加上
        }
    });

    return Math.round(totalAmount * 10) / 10; // 四捨五入到最近的 10 分錢
}

// 調整每個人的金額，確保總金額匹配
function adjustAmount(totalAmount: number, items: PersonItem[]): void {
    const totalPaid = items.reduce((sum, item) => sum + item.amount, 0);
    const difference = totalAmount - totalPaid;

    if (difference !== 0) {
        const adjustment = Math.round(difference * 10) / 10; // 四捨五入到最近的 10 分錢
        items[0].amount += adjustment; // 將調整加到第一個人身上
    }
}

// 示例用法
const billInput: BillInput = {
    date: "2023-02-09",
    location: "Restaurant A",
    tipPercentage: 15,
    items: [
        { name: "Pasta", price: 20, isShared: true },
        { name: "Salad", price: 10, isShared: true },
        { name: "Drink", price: 5, isShared: false, person: "Alice" },
    ],
};

const billOutput = splitBill(billInput);
console.log(billOutput);