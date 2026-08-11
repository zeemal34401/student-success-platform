import { Component } from 'react'
import { ErrorState } from './ui'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="max-w-lg">
            <ErrorState
              error={this.state.error}
              onRetry={() => this.setState({ error: null })}
            />
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
