// 第二遍实现react 方法
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

class ElementWrap {
  constructor(type) {
    // 此时的this root 是HTML Element元素
    this.root = document.createElement(type);
  }
  setAttribute(name, value) {
    this.root.setAttribute(name, value);
  }
  // 传参是component, 如果 component是ElementWrap 或者 TextWrap的话 就直接找他们自己的root
  // 但是如果是 Component类的 会出触发Component里面 get 方法归调用

  appendChild(component) {
    this.root.appendChild(component.root);
  }
}

class TextWrap {
  constructor(content) {
    this.root = document.createTextNode(content);
  }
}
// 自定义组建的父类
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
  get root() {
    if (!this._root) {
      // 如果root没有, 那么就会走 自定义 class 的Render 方法, 然后找到那里面的root
      this._root = this.render().root;
    }
    return this._root;
  }
}

// 这个render 是 toy- react  最外面的render 不是每个class 里面的render
export function render(component, parentElement) {
  // render 去找 组建的root ,如果 最外层是自定义组建的画, 会走到Component里面 get root 方法
  parentElement.appendChild(component.root);
}
