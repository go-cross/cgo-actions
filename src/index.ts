/**
 * The entrypoint for the action.
 */
import './engines/xgo'
import './engines/musl'
import { run } from './main'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
