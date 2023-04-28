import { default as twilio } from 'twilio'
import { TwilioRecipient } from './TwilioRecipient.js'

export class Twilio {
  /** @type {TwilioClient} */
  #client
  /** @type {Person} */
  sender
  /** @type {Person[]} */
  recipients = []

  /**
   * @param {string} SID
   * @param {string} TOKEN
   * @param {Person} sender
   */
  constructor(SID, TOKEN, sender) {
    this.#client = twilio(SID, TOKEN)
    this.sender = sender
  }

  /**
   * @param {string} name
   */
  #getRecipient(name) {
    const recipient = this.recipients.find(recipient => recipient.name === name)
    const existingRecipients = this.recipients
      .map(recipient => recipient.name)
      .join(', ')
    if (recipient === undefined) {
      throw new Error(
        `Recipient \`${name}\` is not configured; did you mean one of [${existingRecipients}]`
      )
    }
    return recipient
  }

  /**
   * @param {Person} recipient
   */
  addRecipient(recipient) {
    this.recipients = this.recipients.concat(recipient)
    return new TwilioRecipient(this.#client, this.sender, recipient)
  }

  /**
   * @param {Person} recipient
   * @param {string} body
   */
  #buildMessage(recipient, body) {
    return { to: recipient.number, body, from: this.sender.number }
  }

  /**
   * @param {string} body
   * @param {{ name?: string, number?: string }} contact
   */
  send(body, { name, number } = {}) {
    if (
      typeof name !== 'string' &&
      typeof number !== 'string' &&
      this.recipients.length === 0
    ) {
      throw new Error('No recipients specified: try `Twilio#addRecipient`')
    }

    if (typeof number === 'string') {
      try {
        return this.#client.messages
          .create(this.#buildMessage({ number }, body))
          .then(message => message.sid)
      } catch (error) {
        throw new Error(error)
      }
    }

    if (typeof name === 'string') {
      const recipient = this.recipients.find(
        recipient => recipient.name === name
      )
      const existingRecipients = this.recipients
        .map(recipient => recipient.name)
        .join(', ')
      if (recipient === undefined) {
        throw new Error(
          `Recipient \`${name}\` is not configured; did you mean one of [${existingRecipients}]`
        )
      }
      try {
        return this.#client.messages
          .create(this.#buildMessage(recipient, body))
          .then(message => message.sid)
      } catch (error) {
        throw new Error(error)
      }
    }

    try {
      const messages = this.recipients.map(recipient =>
        this.#client.messages
          .create(this.#buildMessage(recipient, body))
          .then(message => message.sid)
      )
      return Promise.all(messages)
    } catch (error) {
      throw new Error(error)
    }
  }
}
