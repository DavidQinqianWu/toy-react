// 这里采用Symbol语法来起到private作用
const RENDER_TO_DOM = Symbol("render_to_DOM");

// 所有自定义标签的 父类  
export class Component {
  // 初始化自定义标签, 自定义标签是没有 root的 ,所以是 null
  constructor() {
    this.props = Object.create(null);
    this.children = [];
    this._root = null;
  }
  setAttribute(name, value) {
    this.props[name] = value;
  }
  appendChild(component) {
    this.children.push(component);
  }

  [RENDER_TO_DOM](range) {
    this._range = range;
    this._vdom = this.vdom;
    this._vdom[RENDER_TO_DOM](range);
  }

  update() {
    let isSameNode = (oldNode, newNode) => {
      // 类型不同
      if (oldNode.type !== newNode.type) {
        return;
      }
      // 属性不同
      for (let name in newNode.props) {
        if (newNode.props[name] !== oldNode.props[name]) {
          return false;
        }
      }
      // 属性的数量不同
      if (
        Object.keys(oldNode.props).length !== Object.keys(newNode.props).length
      ) {
        return false;
      }
      // 文本节点内容不同
      if (newNode.type === "#text") {
        if (newNode.content !== oldNode.content) {
          return false;
        }
      }

      return true;
    };

    let update = (oldNode, newNode) => {
      // 首先对比type类型, props 一样不一样
      // 看根结点
      // 在看子节点 #text, content
      if (!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range);
        return;
      }
      newNode._range = oldNode._range;
      let newChildren = newNode.vchildren;
      let oldChildren = oldNode.vchildren;

      if (!newChildren || !newChildren.length) {
        return;
      }
      let tailRange = oldChildren[oldChildren.length - 1]._range;

      for (let i = 0; i < newChildren.length; i++) {
        let newChild = newChildren[i];
        let oldChild = oldChildren[i];
        if (i < oldChildren.length) {
          update(oldChild, newChild);
        } else {
          // TODO
          let range = document.createRange();
          range.setStart(tailRange.endContainer, tailRange.endOffset);
          range.setEnd(tailRange.endContainer, tailRange.endOffset);
          newChild[RENDER_TO_DOM](range);
          tailRange = range;
        }
      }
    };
    let vdom = this.vdom;
    update(this._vdom, vdom);
    this._vdom = vdom;
  }

  setState(newState) {
    if (this.state === null || typeof this.state !== "object") {
      this.state = newState;
      this.update();
      return;
    }
    // setState 假设已经存在了state
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
    this.update();
  }

  get vdom() {
    return this.render().vdom;
  }
}

// 对html标签的封装 
class ElementWrap extends Component {
  constructor(type) {
    super(type);
    this.type = type;
  }

  [RENDER_TO_DOM](range) {
    this._range = range;
    let root = document.createElement(this.type);
    for (let name in this.props) {
      let value = this.props[name];
      // 如果匹配 on 开头的任何字符, 那么直接就把这个转为小写的
      if (name.match(/^on([\s\S]+)$/)) {
        root.addEventListener(
          RegExp.$1.replace(/^[\s\S]/, (c) => c.toLowerCase()),
          value
        );
      } else {
        if (name === "className") {
          root.setAttribute("class", value);
        } else {
          root.setAttribute(name, value);
        }
      }
      root.setAttribute(name, value);
    }
    if (this.vchildren)
      this.vchildren = this.children.map((child) => child.vdom);
    for (let child of this.vchildren) {
      let childRange = document.createRange();
      childRange.setStart(root, root.childNodes.length);
      childRange.setEnd(root, root.childNodes.length);
      child[RENDER_TO_DOM](childRange);
    }
    replaceContent(range, root);
  }

  get vdom() {
    this.vchildren = this.children.map((child) => child.vdom);
    return this;
  }
}

// 对文本节点的封装
class TextWrap extends Component {
  constructor(content) {
    super(content);
    this.type = "#text";
    this.content = content;
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    let root = document.createTextNode(this.content);
    replaceContent(range, root);
  }
  get vdom() {
    return this;
  }
}
// 因为 babel 转义出来的jsx 是 第一位tagName, 第二为Attributes, 第三位是 children
export function createElement(type, attributes, ...children) {
  let e;
  if (typeof type === "string") {
    // 说明这个是一个 h5 标签的tag
    e = new ElementWrap(type);
  } else {
    // babel 转译出来的 返回一个自定义标签的class 调用构造函数
    e = new type();
  }
  // for in 循环每一个属性, 调用实例对象重的setAttribute 方法
  for (let i in attributes) {
    e.setAttribute(i, attributes[i]);
  }
  // 插入子节点, 因为children是数组形式
  let insertChildren = (children) => {
    for (const child of children) {
      // 如果子节点是文字 就生成文字对象
      if (typeof child === "string") {
        child = new TextWrap(child);
      }
      // 如果没有就跳过
      if (child === null) {
        continue;
      }
      // 如果子节点是是多个的话
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

export function render(component, parentElement) {
  // 这里创建一个range
  let range = document.createRange();
  range.setStart(parentElement, 0);
  range.setEnd(parentElement, parentElement.childNodes.length);
  range.deleteContents();
  component[RENDER_TO_DOM](range);
}

function replaceContent(range, node) {
  range.insertNode(node);
  range.setStartAfter(node);
  range.deleteContents();

  range.setStartBefore(node);
  range.setEndAfter(node);
}















