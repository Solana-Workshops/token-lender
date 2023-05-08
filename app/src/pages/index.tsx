import type { NextPage } from 'next';
import Head from 'next/head';
import { HomeView } from '../views';

const Home: NextPage = props => {
    return (
        <div>
            <Head>
                <title>Token Lender</title>
                <meta name="description" content="Token Lender" />
            </Head>
            <HomeView />
        </div>
    );
};

export default Home;
