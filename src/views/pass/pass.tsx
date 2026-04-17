import { useEffect } from 'react';
import { HashLink } from 'react-router-hash-link';
import { Link } from 'react-router-dom';
import { Footer, HomeLogo } from '../home';
import styles from './pass.module.css';

const Pass = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Pass - 5chan';
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <HomeLogo />
        <div className={`${styles.box} ${styles.infoBox}`}>
          <div className={styles.boxBar}>
            <h2>Support 5chan with 5chan Pass</h2>
          </div>
          <div className={styles.boxContent}>
            5chan Pass is a planned paid supporter pass for 5chan. It is <strong>not available yet</strong>. When it launches, 5chan Pass holders will be able to vote on
            directory pages, post on <Link to='/vip'>/vip/</Link>, and bypass typing a CAPTCHA verification or similar posting challenge on 5chan boards that support the
            5chan Pass challenge. Checkout will be <strong>crypto only</strong>. There is no live purchase, activation, or renewal flow today.
          </div>
        </div>
        <div className={styles.columns}>
          <div className={`${styles.box} ${styles.leftBox}`}>
            <div className={styles.boxBar}>
              <h2>Questions</h2>
            </div>
            <div className={styles.boxContent}>
              <ul className={styles.list}>
                <li>
                  <strong>
                    <HashLink to='#overview'>Overview</HashLink>
                  </strong>
                  <ul>
                    <li>
                      <HashLink to='#whatpass'>What is 5chan Pass?</HashLink>
                    </li>
                    <li>
                      <HashLink to='#available'>Is it available now?</HashLink>
                    </li>
                    <li>
                      <HashLink to='#whatdoes'>What will it do?</HashLink>
                    </li>
                    <li>
                      <HashLink to='#whatnot'>What will it not do?</HashLink>
                    </li>
                    <li>
                      <HashLink to='#vip'>What is the /vip/ benefit?</HashLink>
                    </li>
                    <li>
                      <HashLink to='#challenge'>How does zero-friction posting work?</HashLink>
                    </li>
                    <li>
                      <HashLink to='#payment'>How will payment work?</HashLink>
                    </li>
                    <li>
                      <HashLink to='#pricing'>Has pricing been announced?</HashLink>
                    </li>
                    <li>
                      <HashLink to='#nft'>How does the NFT work?</HashLink>
                    </li>
                    <li>
                      <HashLink to='#proceeds'>What happens to the proceeds?</HashLink>
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>
                    <HashLink to='#faq'>FAQ</HashLink>
                  </strong>
                  <ul>
                    <li>
                      <HashLink to='#needpass'>Will I need it to browse or post?</HashLink>
                    </li>
                    <li>
                      <HashLink to='#fiat'>Will fiat payments be accepted?</HashLink>
                    </li>
                    <li>
                      <HashLink to='#vpn'>Will VPNs, proxies, or IP changes matter?</HashLink>
                    </li>
                    <li>
                      <HashLink to='#bypass'>Will it bypass bans or board rules?</HashLink>
                    </li>
                    <li>
                      <HashLink to='#privileges'>Will it grant moderation powers or board ownership?</HashLink>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
          <div className={`${styles.box} ${styles.rightBox}`}>
            <div className={styles.boxBar}>
              <h2 id='overview'>Overview</h2>
            </div>
            <div className={styles.boxContent}>
              <dl>
                <dt className={styles.first} id='whatpass'>
                  What is 5chan Pass?
                </dt>
                <dd>
                  5chan Pass is an upcoming supporter purchase for people who want to fund 5chan directly. When it launches, it will be used for directory voting,
                  zero-friction posting on boards that support the 5chan Pass challenge, and posting on <Link to='/vip'>/vip/</Link>.
                </dd>
                <dt id='available'>Is it available now?</dt>
                <dd>No. This page is a placeholder so the future 5chan Pass route already exists, but there is nothing to buy, activate, or renew yet.</dd>
                <dt id='whatdoes'>What will it do?</dt>
                <dd>
                  When it launches, 5chan Pass will let eligible users vote on directory assignments through each directory&apos;s voting page, post on{' '}
                  <Link to='/vip'>/vip/</Link>, and bypass typing a CAPTCHA verification or similar posting challenge on all 5chan boards that support the pass challenge.
                  Reporting is not available yet, so the pass does not currently apply to reports.
                </dd>
                <dt id='whatnot'>What will it not do?</dt>
                <dd>
                  5chan Pass will not give moderation powers, board ownership, special posting privileges, or any way to ignore board-specific{' '}
                  <Link to='/rules'>rules</Link>. It also will not unlock anything today, because the feature has not launched yet.
                </dd>
                <dt id='vip'>What is the /vip/ benefit?</dt>
                <dd>
                  Only 5chan Pass users will be able to post on <Link to='/vip'>/vip/</Link>. Browsing rules and long-term direction for that board can still evolve, but
                  the current plan is that posting there is restricted to pass holders.
                </dd>
                <dt id='challenge'>How does zero-friction posting work?</dt>
                <dd>
                  On boards that support the 5chan Pass challenge, pass holders will be able to bypass typing a CAPTCHA verification or similar challenge before posting.
                  This is similar in spirit to how 4chan Pass reduces posting friction, except 5chan reports are not available yet.
                </dd>
                <dt id='payment'>How will payment work?</dt>
                <dd>
                  5chan Pass will be sold through a crypto-only checkout when it becomes available. No credit cards, PayPal, or other fiat payment methods will be
                  accepted.
                </dd>
                <dt id='pricing'>Has pricing been announced?</dt>
                <dd>
                  Yes, the planned pricing model is the same simple structure: Passes cost $30 for 1 year or $60 for 3 years, which is about $1.67 per month or less than
                  a single 20oz bottle of soda.
                </dd>
                <dt id='nft'>How does the NFT work?</dt>
                <dd>
                  5chan Pass will be an NFT under the hood, powered by the open-source{' '}
                  <a href='https://github.com/bitsocialnet/mintpass' target='_blank' rel='noopener noreferrer'>
                    MintPass
                  </a>{' '}
                  service. The 5chan Pass challenge will only accept NFTs minted within the last year, so an NFT older than one year will count as expired until it is
                  renewed or replaced.
                </dd>
                <dt id='proceeds'>What happens to the proceeds?</dt>
                <dd>
                  All proceeds from 5chan Pass are intended to burn BSO, the official cryptocurrency token of{' '}
                  <a href='https://bitsocial.net' target='_blank' rel='noopener noreferrer'>
                    Bitsocial
                  </a>
                  . This is planned to happen automatically in the smart contract. The resulting on-chain transactions will be transparent, so buyers should assume their
                  purchase wallet activity can be publicly visible.
                </dd>
                <dt id='faq'>Will I need it to browse or post?</dt>
                <dd id='needpass'>
                  No. 5chan Pass is not required to read boards, subscribe to boards, or post normally. It is for specific benefits like directory voting, posting on{' '}
                  <Link to='/vip'>/vip/</Link>, and zero-friction posting on boards that support the challenge.
                </dd>
                <dt id='fiat'>Will fiat payments be accepted?</dt>
                <dd>No. When 5chan Pass launches, payment will be crypto only.</dd>
                <dt id='vpn'>Will VPNs, proxies, or IP changes matter?</dt>
                <dd>
                  No. Because 5chan Pass is planned as an NFT-based credential, it is not meant to depend on a fixed IP address. There is no intended restriction based on
                  VPN use, proxies, or changing networks.
                </dd>
                <dt id='bypass'>Will it bypass bans or board rules?</dt>
                <dd>No. A pass is not a way around bans, posting restrictions, or board moderation. Every board still sets and enforces its own rules.</dd>
                <dt id='privileges'>Will it grant moderation powers or board ownership?</dt>
                <dd>No. Buying a pass will not make someone a moderator, an admin, or the owner of a board. It is a supporter purchase, not a governance override.</dd>
              </dl>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Pass;
