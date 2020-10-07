import { Component, createElement, render } from "./toy-react2";

class MyComponent extends Component {
  render() {
    return (
      <div>
        <h1>my component</h1>
        {this.children}
      </div>
    );
  }
}

render(
  <MyComponent id='a' class='c'>
    woshi ni mamamam
    <div>123</div>
  </MyComponent>,
  document.body
);
