// 第二遍实现react 方法
const RENDER_TO_DOM = Symbol("render to dom");

export function createElement(type, attributes, ...children) {
  let e;
  if (typeof type === "string") {
    // 说明是H5 节点, 那么就可以直接 用document.createElement方法
    e = new ElementWrap(type);
  } else {
    e = new type();
  }
  console.log(e);
  for (let p in attributes) {
    e.setAttribute(p, attributes[p]);
  }

  let insertChildren = (children) => {
    for (const child of children) {
      if (typeof child === "string") {
        child = new TextWrap(child);
      }
      if (child == null) {
        continue;
      }
      // 因为我们用了... 语法 ,该语法会把所有的自类, 都给合并成一个数组
      if (typeof child === "object" && child instanceof Array) {
        insertChildren(child);
      } else {
        e.appendChild(child);
      }
    }
  };
  insertChildren(children);

  return e;
}

class ElementWrap extends Component{
  constructor(type) {
    super(type);
    // 此时的this root 是HTML Element元素
    this.type= type;
    this.root = document.createElement(type);
  }
  // 要针对 H5标签做一些特殊处理
  setAttribute(name, value) {
    if (name.match(/^on([\s\S]+)/)) {
      this.root.addEventListener(
        RegExp.$1.replace(/^[\s\S]/, (c) => c.toLowerCase()),
        value
      );
    } else {
      if (name === "className") {
        this.root.setAttribute("class", value);
      }
      this.root.setAttribute(name, value);
    }
  }

  // 如果 component是 自定义节点, 因为 Component里面没有 get root() 了, 所以拿不到的,
  // 而是应该调用一个新的range, 生成让后把H5的节点传入进去
  appendChild(component) {
    let range = document.createRange();
    range.setStart(this.root, this.root.childNodes.length);
    range.setEnd(this.root, this.root.childNodes.length);
    component[RENDER_TO_DOM](range);
  }
  // 因为是H5标签, 所以这里跟Component 不一样, 不再是循环调用,而是用 dom 里面的Range 方法 给他添加进去
  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root);
  }

  get vdom() {
    return {
      type: this.type,
      props: this.props,
      children: this.children.map(child=>child.dom);
    } 
  }
}

class TextWrap extends Component {
  constructor(content) {
    super(content); 
    this.content = content;
    this.root = document.createTextNode(content);
  }
  // 如果自定义组建中 没有 override 的话, 那么就一直会调用, 直到找到H5标签里面的 renderToDOM
  // 因为是 text 标签, 所以这里跟Component 不一样, 不再是循环调用,而是用 dom 里面的Range 方法 给他添加进去
  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
  get vdom(){
    return {
      type: "#text",
      content: this.content;
    }
  }
}
// 自定义组建的父类
export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];
    this._range = null;
  }
  setAttribute(name, value) {
    this.props[name] = value;
  }
  appendChild(component) {
    this.children.push(component);
  }
  // [RENDER_TO_DOM] 这种写法在object里面或者class 里面 相当于 调用了
  // object 中的 'render to dom' 这个key
  // 如果自定义组建中 没有 override 的话, 那么就一直会调用, 直到找到H5标签里面的 renderToDOM
  // 同时我们还要把对应的range给保存起来
  [RENDER_TO_DOM](range) {
    this._range = range;
    this.render()[RENDER_TO_DOM](range);
  }
  rerender() {
    let oldRange = this._range;
    let range = document.createRange();
    range.setStart(oldRange.startContainer, oldRange.startOffset);
    range.setEnd(oldRange.startContainer, oldRange.startOffset);
    // 先把这个range里面的东西删除掉
    this[RENDER_TO_DOM](range);
    oldRange.setStart(range.endContainer, range.endOffset);
    oldRange.deleteContents();
    // 然后重新渲染
  }
  setState(newState) {
    if (this.state === null || typeof this.state !== "object") {
      this.state = newState;
      this.rerender();
      return;
    }
    let merge = (oldState, newState) => {
      for (let p in newState) {
        if (oldState[p] === null || typeof oldState[p] !== "object") {
          oldState[p] = newState[p];
        } else {
          merge(oldState[p], newState[p]);
        }
      }
    };
    merge(this.state, newState);
    this.rerender();
  }

  get vdom() {
    this.render().vdom;
  }
  
}

// 这个render 是 toy- react  最外面的render 不是每个class 里面的render
export function render(component, parentElement) {
  let range = document.createRange();
  range.setStart(parentElement, 0);
  range.setEnd(parentElement, parentElement.childNodes.length);
  range.deleteContents();
  // 如果component 是 H5标签, 那么就会直接用ElementWrap里面的 [RENDER_TO_DOM] 方法
  // 如果 component 是 text 标签, 那么就用 TextWrap 里面的[RENDER_TO_DOM] 方法
  // 如果 component 是 自定衣标签, 那么就用 Component 里面的 [RENDER_TO_DOM] 方法
  component[RENDER_TO_DOM](range);
}
