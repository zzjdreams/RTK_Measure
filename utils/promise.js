function wxPromisify(fn) {
  return function (obj = {}) {
    return new Promise((resolve, reject) => {
      //解析success中的内容
      obj.success = function (res) {
        resolve(res)
        console.log('prom succ',res)
      }

      //解析fail中的内容
      obj.fail = function (res) {
        reject(res)
        console.log('prom fail', res)
      }

      //将对象替换
      fn(obj)
    })
  }
}

//暴露函数接口
module.exports = {
  wxPromisify: wxPromisify
}
