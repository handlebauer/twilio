export class TwilioRecipient {
  /** @type {TwilioClient} */
  #client
  /** @type {Person} */
  #sender
  /** @type {string} */
  name
  /** @type {string} */
  number

  /**
   * @param {TwilioClient} client
   * @param {Person} sender
   * @param {Person} person
   */
  constructor(client, sender, { name, number }) {
    this.#client = client
    this.#sender = sender
    this.name = name
    this.number = number
  }

  /**
   * @param {string} body
   */
  #buildMessage(body) {
    return { to: this.number, body, from: this.#sender.number }
  }

  /**
   * @param {string} body
   */
  send(body) {
    try {
      return this.#client.messages
        .create(this.#buildMessage(body))
        .then(message => message.sid)
    } catch (error) {
      throw new Error(error)
    }
  }
}
