// 这里采用Symbol语法来起到private作用
const RENDER_TO_DOM = Symbol("render_to_DOM");

class ElementWrap {
  constructor(type) {
    this.root = document.createElement(type);
  }
  setAttribute(name, value) {
    // 如果匹配 on 开头的任何字符, 那么直接就把这个转为小写的
    if (name.match(/^on([\s\S]+)$/)) {
      this.root.addEventListener(
        RegExp.$1.replace(/^[\s\S]/, (c) => c.toLowerCase()),
        value
      );
    } else {
      if (name === "className") {
        this.root.setAttribute("class", value);
      } else {
        this.root.setAttribute(name, value);
      }
    }
    this.root.setAttribute(name, value);
  }
  appendChild(component) {
    let range = document.createRange();
    range.setStart(this.root, this.root.childNodes.length);
    range.setEnd(this.root, this.root.childNodes.length);
    component[RENDER_TO_DOM](range);
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

class TextWrap {
  constructor(content) {
    this.root = document.createTextNode(content);
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

export class Component {
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
    this.render()[RENDER_TO_DOM](range);
  }

  rerender() {
    let oldRange = this._range;

    let range = document.createRange();
    range.setStart(oldRange.startContainer, oldRange.startOffset);
    range.setEnd(oldRange.startContainer, oldRange.startOffset);
    this[RENDER_TO_DOM](range);

    oldRange.setStart(range.endContainer, range.endOffset);
    oldRange.deleteContents();
  }
  setState(newState) {
    if (this.state === null || typeof this.state !== "object") {
      this.state = newState;
      this.rerender();
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
    this.rerender();
  }
}

// 因为 babel 转义出来的jsx 是 第一位tagName, 第二为Attributes, 第三位是 children
export function createElement(type, attributes, ...children) {
  let e;
  if (typeof type === "string") {
    // 说明这个是一个 h5 标签的tag
    e = new ElementWrap(type);
  } else {
    e = new type();
  }
  for (let i in attributes) {
    e.setAttribute(i, attributes[i]);
  }

  let insertChildren = (children) => {
    for (const child of children) {
      if (typeof child === "string") {
        child = new TextWrap(child);
      }
      if (child === null) {
        continue;
      }
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
