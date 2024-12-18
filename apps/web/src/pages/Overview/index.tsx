import { InterfaceElementName } from '@uniswap/analytics-events'
import { TopPoolTable } from 'components/Pools/PoolTable/PoolTable'
//import { TopTokensTable } from 'components/Tokens/TokenTable'
import { useQuery } from '@tanstack/react-query'
import { TopFundsTable } from 'components/Funds/FundTable'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { useChainFromUrlParam } from 'constants/chains'
import { gql, request } from 'graphql-request'
import RecentTransactions from 'pages/Explore/tables/RecentTransactions'
import { useEffect, useMemo, useRef, useState } from 'react'
import { StyledInternalLink } from 'theme/components'
import { Flex, Text } from 'ui/src'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { Trans } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'
const query = gql`
  {
    funds(orderBy: currentUSD, orderDirection: desc, subgraphError: allow) {
      id
      createdAtTimestamp
      manager
      investorCount
      currentUSD
    }
  }
`

// interface Fund {
//   id: string;
//   createdAtTimestamp: string;
//   manager: string;
//   investorCount: string;
//   currentUSD: string;
// }

// interface TopFunds {
//   funds: Fund[];
// }

const url = 'https://api.studio.thegraph.com/query/44946/dotoli/version/latest'

export enum ExploreTab {
  Tokens = 'tokens',
  Pools = 'pools',
  Transactions = 'transactions',
}

interface Page {
  title: React.ReactNode
  key: ExploreTab
  component: () => JSX.Element
  loggingElementName: InterfaceElementName
}

const Pages: Array<Page> = [
  {
    title: <Trans i18nKey="common.tokens" />,
    key: ExploreTab.Tokens,
    component: TopFundsTable,
    loggingElementName: InterfaceElementName.EXPLORE_TOKENS_TAB,
  },
  {
    title: <Trans i18nKey="common.pools" />,
    key: ExploreTab.Pools,
    component: TopPoolTable,
    loggingElementName: InterfaceElementName.EXPLORE_POOLS_TAB,
  },
  {
    title: <Trans i18nKey="common.transactions" />,
    key: ExploreTab.Transactions,
    component: RecentTransactions,
    loggingElementName: InterfaceElementName.EXPLORE_TRANSACTIONS_TAB,
  },
]

function TestApp() {
  const { data, status } = useQuery({
    queryKey: ['data'],
    async queryFn() {
      return await request(url, query)
    },
  })

  // const jsonString = JSON.stringify(data ?? {})
  // const jsonData: TopFunds = JSON.parse(jsonString);

  // if (jsonData.funds) {
  //   jsonData.funds.forEach((fund: Fund) => {
  //     console.log("ID:", fund.id);
  //     console.log("Created At Timestamp:", fund.createdAtTimestamp);
  //     console.log("Manager:", fund.manager);
  //     console.log("Investor Count:", fund.investorCount);
  //     console.log("Current USD:", fund.currentUSD);
  //     console.log("---------------------");
  //   });
  // }

  return (
    <main>
      {status === 'pending' ? <div>Loading...</div> : null}
      {status === 'error' ? <div>Error ocurred querying the Subgraph</div> : null}
      <div>{JSON.stringify(data ?? {})}</div>
    </main>
  )
}

const OverviewPage = ({ initialTab }: { initialTab?: ExploreTab }) => {
  const tabNavRef = useRef<HTMLDivElement>(null)
  const isMultichainExploreEnabled = useFeatureFlag(FeatureFlags.MultichainExplore)

  useEffect(() => {
    if (tabNavRef.current) {
      const offsetTop = tabNavRef.current.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: offsetTop - 90, behavior: 'smooth' })
    }
    // scroll to tab navbar on initial page mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chainWithoutFallback = useChainFromUrlParam()
  const chain = useMemo(() => {
    return isMultichainExploreEnabled
      ? chainWithoutFallback
      : chainWithoutFallback ?? UNIVERSE_CHAIN_INFO[UniverseChainId.Mainnet]
  }, [chainWithoutFallback, isMultichainExploreEnabled])

  const initialKey: number = useMemo(() => {
    const key = initialTab && Pages.findIndex((page) => page.key === initialTab)

    if (!key || key === -1) {
      return 0
    }
    return key
  }, [initialTab])
  const [currentTab, setCurrentTab] = useState(initialKey)
  const { component: Page } = Pages[currentTab]

  return (
    <Flex width="100%" minWidth={320} pt="$spacing48" px="$spacing40" $md={{ p: '$spacing16', pb: 0 }}>
      {/* <ExploreChartsSection /> */}
      <TestApp />
      <Flex
        ref={tabNavRef}
        row
        maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
        mt={0}
        mx="auto"
        mb="$spacing4"
        alignItems="center"
        justifyContent="space-between"
        width="100%"
        $lg={{
          row: false,
          flexDirection: 'column',
          mx: 'unset',
          alignItems: 'flex-start',
          gap: '$spacing16',
        }}
      >
        <Flex
          row
          gap="$spacing24"
          flexWrap="wrap"
          justifyContent="flex-start"
          $md={{ gap: '$spacing16' }}
          data-testid="explore-navbar"
        >
          {Pages.map(({ title, key }, index) => {
            // hide Transactions tab if no chain is selected
            return key !== ExploreTab.Transactions || !!chain ? (
              <StyledInternalLink
                onClick={() => setCurrentTab(index)}
                to={
                  `/explore/${key}` + (chain?.id || chain?.id !== UniverseChainId.Mainnet ? `/${chain?.urlParam}` : '')
                }
              >
                <Text
                  variant="heading3"
                  fontSize={28}
                  $lg={{ fontSize: 24, lineHeight: 32 }}
                  fontWeight="$book"
                  color={currentTab === index ? '$neutral1' : '$neutral2'}
                  cursor="pointer"
                  animation="quick"
                  key={key}
                >
                  {title}
                </Text>
              </StyledInternalLink>
            ) : null
          })}
        </Flex>
      </Flex>
      <Page />
    </Flex>
  )
}

export default OverviewPage
