import * as core from '@actions/core'
import * as github from '@actions/github'
import { Runner } from './runner'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const e = new Runner(github.context)
    await e.run()
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
