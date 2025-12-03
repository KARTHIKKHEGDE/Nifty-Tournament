import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta charSet="utf-8" />
                <meta name="description" content="ScalarVerse - Advanced options trading platform. Practice with virtual money and compete in tournaments for real prizes!" />
                <meta name="keywords" content="scalarverse, options, trading, paper trading, tournaments, stock market, india" />
                <meta name="author" content="ScalarVerse Platform" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
