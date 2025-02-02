// 以 2 為間距顯示由 1 至 9 的數字，即顯示 1、3、5、7、9
for (let i = 1 ; i < 11 ; i ++) {
    if (i % 2 != 0) {
        console.log(i)
        continue
    }
}