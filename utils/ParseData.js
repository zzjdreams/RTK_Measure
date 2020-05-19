const strUtil=require('./StrUtil.js');
const watch=require('./watch.js')

var ParseData = function ParseData(opt_options){
  var options = opt_options || {};
  this.strString='';
  this.working=false;
  this.isHead=false;
  this.commArry=[];
  this.outputMsg="";
}

ParseData.prototype.parseArray=function(arrayBuffer){
  var str=strUtil.arrayBuffer2String(arrayBuffer);
  if(str.includes('$')){
    this.isHead=true;
    // this.strString="";
    if(this.strString.includes('$')){
      this.strString="";
    }
  }
  if(this.isHead){
    this.strString+=str;
    if (this.strString.includes('\r\n')) {
      if (this.strString.lastIndexOf("$") > this.strString.indexOf('\r\n')){
        this.isHead=true;
        this.commArry.push(this.strString.slice(0, this.strString.lastIndexOf("$")));
        this.outputMsg = this.strString.slice(0, this.strString.lastIndexOf("$"));
        this.strString = this.strString.slice(this.strString.lastIndexOf("$"));
      }else{
        this.isHead = false;
        this.commArry.push(this.strString);
        this.outputMsg = this.strString;
        this.strString="";
      }
    }
  }
}

ParseData.prototype.onReceiveBLE=function(){
  watch.watchData(this, "outputMsg", this.asciiManger)
}

ParseData.prototype.asciiManger=function(head,data,foot){
  var dataArr=data.split(',');
  if(head=='$ICEGPS'){
    console.log(data)
  }
}

var splitArr = [];
function separateData(value){ 
  splitArr[0]=value.slice(0,value.indexOf(','));
  splitArr[1] = value.slice(value.indexOf(',') + 1, value.indexOf('*'));
  splitArr[2] = value.slice(value.indexOf('*') + 1, value.indexOf('\r\n'));
  return splitArr;
}

function watchData(obj, name, method) {
  let temp = null;
  var arr;
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable: true,
    set: function (value) {
      temp = value;
      arr = separateData(value);
      if(arr[2]===checkSum(value.slice(0,value.indexOf('*')))){
        method(arr[0],arr[1],arr[2]);
      }     
    },
    get: function () {
      // 可以在这里打印一些东西，然后在其他界面调用getApp().globalData.name的时候，这里就会执行。
      return temp
    }
  })
}

//计算校验和
function checkSum(s) {
  var sum = 0;
  for (var i = 1; i < s.length; i++) {
    sum ^= (s.charAt(i)).charCodeAt();
  }
  var hexNum = sum.toString(16);
  return  hexNum ;
}


export default ParseData;