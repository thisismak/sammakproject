// 練習01 - 顯示 I love coding 10 次
for (let i_01 = 0 ; i_01 < 10 ; i_01 ++) {
    console.log("I love coding")
}
console.log("↑↑↑↑↑↑練習01")
// 練習02 - 顯示由 1 至 10 的數字
for (let i_02 = 1 ; i_02 < 11 ; i_02 ++) {
    console.log(i_02)
}
console.log("↑↑↑↑↑↑練習02")
// 顯示由 10 至 1 的數字
for (let i_03 = 11 ; i_03 > 0 ; i_03 --) {
    console.log(i_03)
}
console.log("↑↑↑↑↑↑練習03")
// 以 2 為間距顯示由 1 至 9 的數字，即顯示 1、3、5、7、9
for (let i_04 = 1 ; i_04 < 10 ; i_04 ++) {
    if (i_04 % 2 === 0) {
        console.log(i_04)
        continue
    }
}
console.log("↑↑↑↑↑↑練習04")