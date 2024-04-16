/**
 * The entrypoint for the action.
 */
import './engines/xgo'
import './engines/musl'
import './engines/win-arm64'
import './engines/android'
import { run } from './main'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
