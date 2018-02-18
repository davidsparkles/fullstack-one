import { createTestAccount, createTransport, getTestMessageUrl } from 'nodemailer';
import { htmlToText } from 'nodemailer-html-to-text';

import * as ONE from '../core';

ONE.Service();
export class Email extends ONE.AbstractPackage {

  private isReady = false;
  private transport;

  // DI dependencies
  private CONFIG: any;
  private readonly queue: any;
  private logger: ONE.ILogger;
  @ONE.Inject()
  private eventEmitter: ONE.EventEmitter;

  constructor(
    @ONE.Inject(type => ONE.Queue) queue?,
    @ONE.Inject(type => ONE.LoggerFactory) loggerFactory?
  ) {
    super();

    // set DI dependencies
    this.CONFIG = this.getConfig('email');
    this.queue = queue.getQueue();
    this.logger = loggerFactory.create('Email');

    if (this.CONFIG.testing) {
      createTestAccount((err, account) => {
        if (err) {
          this.logger.warn('testingAccount.creation.error', err);
          throw err;
        } else {
          this.logger.trace('testingAccount.creation.success', account.user);
        }

        this.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: {
            user: account.user, // generated ethereal user
            pass: account.pass  // generated ethereal password
          }
        });
      });

    } else {
      if (this.CONFIG.transport && this.CONFIG.transport.smtp) {
        this.createTransport(this.CONFIG.transport.smtp);
      }

    }

    // subscribe to sendmail jobs
    this.queue.subscribe('sendmail', this._sendMail.bind(this))
    .then(() => this.logger.trace('subscribed.job.sendmail.success'))
    .catch((err) => {
      this.logger.warn('subscribed.job.sendmail.error', err);
      throw err;
    });

  }

  public async sendMessage(to: string, subject: string, html: string, attachments: undefined[] = [], from?: string): Promise<any> {
    if (this.isReady) {

      // Message object
      const message = { from, to, subject, html };

      try {

        const jobOptions = {
          ... this.CONFIG.queue
        };

        const jobId = await this.queue.publish('sendmail', message, jobOptions);
        this.logger.trace('sendMessage.job.creation.success', jobId);
        return jobId;

      } catch (err) {
        this.logger.warn('sendMessage.job.creation.error', err);
        throw err;
      }

    } else {

      // retry sending message when transport is ready
      this.eventEmitter.on('transport.ready', async () => {
        return await this.sendMessage(to, subject, html, attachments, from);
      });

    }

  }

  private async _sendMail(job: any) {
    const message = job.data;

    try {
      const mailInfo = await this.transport.sendMail(message);
      this.logger.trace('sendMessage.transport.sendMail.success', mailInfo);
      // extract email url for testing
      if (this.CONFIG.testing) {
        this.logger.trace('testingAccount.sendMail.success.url', getTestMessageUrl(mailInfo));
      }

      // send event with email success
      this.eventEmitter.emit(`sendMessage.success.${job.id}`);

      // mark job as done
      job.done()
      .then(() => this.logger.trace('sendMessage.job.marked.completed.success', job.id))
      .catch((err) => {
        this.logger.warn('sendMessage.job.marked.completed.error', err);
        throw err;
      });

      return mailInfo;
    } catch (err) {
      this.logger.warn('sendMessage.transport.sendMail.error', err.message);
      this.eventEmitter.emit(`sendMessage.error.${job.id}`);
      throw err;
    }
  }

  // create transport
  private async createTransport(credentials: object) {
    // create reusable transporter object using the default SMTP transport
    this.transport = createTransport(credentials);
    this.transport.use('compile', htmlToText(this.CONFIG.htmlToText));
    this.isReady = true;
    this.eventEmitter.emit('transport.ready');
    this.logger.trace('transport.ready');

  }

}