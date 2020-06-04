const strUtil=require('./StrUtil.js');
var app=getApp();

var ParseData = function ParseData(){
  var that=this;
  this.strString='';
  this.working=false;
  this.isHead=false;
  this.commArry=[];
  this.outputMsg="";

  this.index=0;
}

ParseData.prototype.transit = function (str){
  // app.bleListener.receiveData=str;
  var arr = separateData(str);
  if (arr[2] === checkSum(str.slice(0, str.indexOf('*')))) {
    this.asciiManger(arr[0], arr[1], arr[2]);
  }  
  // this.outputMsg=str ;
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
    if (this.strString.includes('\n')) {
      if (this.strString.lastIndexOf("$") > this.strString.indexOf('\n')){
        this.isHead=true;
        // console.log('str1', this.strString.slice(0, this.strString.lastIndexOf("$")));
        // this.commArry.push(this.strString.slice(0, this.strString.lastIndexOf("$")));
        this.transit(this.strString.slice(0, this.strString.lastIndexOf("$"))) ;
        
        this.strString = this.strString.slice(this.strString.lastIndexOf("$"));
        // console.log('拼接后：', this.strString);
      }else{
      
        this.isHead = false;
        // this.commArry.push(this.strString);
        // console.log('str', this.strString);
        this.transit(this.strString);
        console.log('拼接后：', this.strString);
        this.strString="";
        if(this.index==1){
          console.time('lookMe')
        }
        this.index++;
        if(this.index==400){
          console.timeEnd('lookMe')
        }
      }
    }
  }
}

ParseData.prototype.onReceiveBLE=function(){
  watchData(this, "outputMsg", this.asciiManger)
  setTimeout(()=>{
    this.outputMsg = "$ICEGPS,FACTORY,GETUID*51\r\n"
  },3000)
  console.log(this.outputMsg);
  
}

ParseData.prototype.asciiManger=function(head,data,foot){
  var dataArr = data.split(',');
  if(head=='$ICEGPS'){
    console.log('==data===',data)
    
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
  console.log(obj,obj.outputMsg)
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


// function a(str,fn){
//   if(typeof(str)=="string"){
//     console.log(str)
//   }
//   if(typeof(fn)=="function"){
//     fn(str)
//   }
// }

// function f(res){
//   console.log('到你',res)
// }