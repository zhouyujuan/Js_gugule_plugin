//混合模式  构造函数  原型
function Card(obj) {
    // 参数的验证
    if (typeof(obj) != 'object') {
        throw new Error('should be Object');
    }
    //把外部参数放到一个对象中
    this.state = obj ? obj : {};

    //内部参数验证,这个props自定义的，参数要和外部的一致
    this.props = {
        container: 'string.isReq', //父级
        resultText: 'string.isReq', //自定义的参数名抽奖结果，定义参数类型是字符串，是必须填写的
        textBgcolor: 'string.notReq', //不是必须的，字样层背景颜色
        defaultColor: 'string.notReq', //刮层背景
        rubberSize: 'number.notReq', //橡皮擦的大小
        rubber: 'string.notReq', //鼠标的图片，最好是个ico，大小有效值 30*30
        canvasWidth: 'number.notReq',
        canvasHeight: 'number.notReq'
    }
    this.rubberLock = false; //橡皮擦的开关
    // 父级容器的样式,反引号用法
    this.cardStyle = `#${this.state.container}{
        position:relative;

    }`

    this.cardsize = `.card{
        width:${this.state.canvasWidth}px;
        height:${this.state.canvasHeight}px;
    }`

    //字样层的样式
    this.resultStyle = `.card-result{
        width:100%;
        height:100%;
        color: #333;
        font-size: 20px;
        line-height: ${this.state.canvasHeight}px;
        text-align: center;
        background: ${this.state.textBgColor};
    }`

    console.log('resultStyle', this.resultStyle)

    //剐蹭的定位
    this.maskStyle = `.mask{
        position:absolute;
        top:0;
        left:0;
        cursor: ${this.state.rubber};
    }`;
    // 获取元素
    this._$ = function(selector) {
        return document.querySelector(selector);

    }
    // 创建元素
    this._createEle = function(ele) {
        return document.createElement(ele);
    }
    // 给创建的元素插入文本
    this._setCons = function(ele, text) {
        ele.innerText = text;
    }
    //创建好的元素添加到指定的位置
    this._appendChild = function(parents, child) { parents.appendChild(child) }

    this._init() //初始化的执行
}

//添加样式,这个没写完
Card.prototype._addStyle = function() {
    let $ = this._$;
    let style = this._createEle('style');
    let styleCon = `${this.cardStyle}${this.resultStyle}${this.maskStyle}`.replace(/\s/g, "");
    this._setCons(style, styleCon);
    this._appendChild($('head'), style);
}

Card.prototype._addchangesize = function() {
    let $ = this._$;
    let style = this._createEle('style');
    let styleCon = `${this.cardsize}`.replace(/\s/g, "");
    this._setCons(style, styleCon);
    this._appendChild($('head'), style);
    console.log('style', style);
}

Card.prototype._init = function() {
    this._validate();
    this._addchangesize();
    this._addStyle();
    this._addResult();
    this._addMask();

}


// 在插件内部调用的方法

// 验证数据的方法
Card.prototype._validate = function() {
    let propTypes = this.props;
    Object.getOwnPropertyNames(propTypes).forEach((val, index, array) => {
        // 获取外部参数的参数类型

        let stateType = typeof this.state[val];

        // 类型
        let propsType = propTypes[val].split('.')[0];

        // 是否必须
        let req = propTypes[val].split('.')[1];

        // 内部和外部的必要性
        let isReq = req === 'isReq' ? true : false;
        let isPropType = propsType === stateType ? true : false;
        if (isReq && !this.state[val]) {
            throw new Error("short of props")
        }
        if (!isPropType && this.state[val]) {
            throw new Error('type error ')
        }

    })
}

//创建字样层
Card.prototype._addResult = function() {
    let $ = this._$; //自己定义的方法
    //动态的创建的字样层的div
    let resultEle = this._createEle('div');
    //天🏠样式,给div添加一个class
    resultEle.setAttribute('class', 'card-result');
    //添加的文字内容放进去  抽奖的结果
    this._setCons(resultEle, this.state.resultText);
    //添加到父级上
    this._appendChild($(`#${this.state.container}`), resultEle)

}
//创建刮层
Card.prototype._addMask = function() {
    var that = this;
    let $ = this._$;
    //获取父级
    let parentEle = $(`#${this.state.container}`);
    let canvasEle = this._createEle('canvas');
    canvasEle.setAttribute('class', 'mask');
    this._appendChild(parentEle, canvasEle);

    //设置画布的宽高
    let canvasH = parentEle.offsetHeight; //获取父级的高度
    let canvasW = parentEle.offsetWidth;
    console.log('id', $('.card'));
    console.log('canvasH', canvasH);
    console.log('canvasW', canvasW);

    canvasEle.setAttribute('width', canvasW);
    canvasEle.setAttribute('height', canvasH);

    //绘制刮层
    let context = canvasEle.getContext('2d');
    //注意先fillstyle,在绘制
    context.fillStyle = this.state.defaultColor ? this.state.defaultColor : '#999';
    context.fillRect(0, 0, canvasW, canvasH); //绘制矩形
    // 刮层动作实现， mousedown,mousemove,mouseup
    canvasEle.addEventListener('mousedown', function(e) {
        //开启橡皮擦的功能
        that._start(e, canvasEle);

    })
    canvasEle.addEventListener('mousemove', function(e) {
        //鼠标移动删除刮层
        that._clear(e, canvasEle, context);

    })

    canvasEle.addEventListener('mouseup', function(e) {
        //关闭橡皮擦的功能
        that._close();
    })
}

Card.prototype._start = function(e, canvasEle) {
    e.preventDefault(); //当拖动是会出现选中文字的现象解决方法
    this.rubberLock = true;
}
Card.prototype._clear = function(e, canvasEle, context) {
    //要调用清除的api，所以一定要有contentx
    if (!this.rubberLock) {
        return;
    }
    // 左上角的点相对句界面的左上角的位置

    //获取 画布在窗口基点（左上角）的距离
    let boundT = canvasEle.getBoundingClientRect().top;
    let boundL = canvasEle.getBoundingClientRect().left;

    //计算鼠标当前位置到画布基点的距离
    let mouseX = e.clientX - boundL;
    let mouseY = e.clientY - boundT;

    //启用橡皮擦除刮层
    //橡皮的大小
    let rubberSize = this.state.rubberSize ? this.state.rubberSize : 20;
    //清除一定的区域,起始点,结束点是橡皮的大小
    context.clearRect(mouseX, mouseY, rubberSize, rubberSize);

}

// 关闭橡皮
Card.prototype._close = function(e) {
    this.rubberLock = false;
}

Card.prototype.removeChild = function(idname) {
    var div = document.getElementById(idname);
    while (div.hasChildNodes()) //当div下还存在子节点时 循环继续  
    {
        div.removeChild(div.firstChild);
    }
}
