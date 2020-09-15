document.body.appendChild(
  <div class='a' id='b'>
    123
    <div></div>
  </div>
);

// 因为 babel 转义出来的jsx 是 第一位tagName, 第二为Attributes, 第三位是 children
function createElement(tagName, attributes, ...children) {
  let e = document.createElement(tagName);
  for (let i in attributes) {
    e.setAttribute(i, attributes[i]);
  }
  for (const child of children) {
    if (typeof child === "string") {
      child = document.createTextNode(child);
    }
    e.appendChild(child);
  }
  return e;
}
