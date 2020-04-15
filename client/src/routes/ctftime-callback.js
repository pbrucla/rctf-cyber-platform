import { Component } from 'preact'

export default class CtftimeCallback extends Component {
  componentDidMount () {
    window.opener.postMessage({
      kind: 'ctftimeCallback',
      state: this.props.state,
      ctftimeCode: this.props.code
    })
    window.close()
  }

  render () {
    return <span />
  }
}
