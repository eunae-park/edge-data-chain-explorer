import React, {useEffect, useState} from 'react'
import InformationCard from "../../component/InformationCard"
import ExplorerAPI from "../../ExplorerAPI"
import {useParams} from 'react-router-dom'
import {displayAMOLong} from "../../util"
import {TransactionSchema} from "../../reducer/blockchain"
import {AxiosError} from "axios"
import {txColumns2, incentiveColumns} from "../../component/columns"
import {useDispatch} from "react-redux"
import {replace} from "connected-react-router"
import {Tabs, Tab, Container} from "@material-ui/core"
import InfiniteTable from "../../component/InfiniteTable"
import {useChainId} from "../../reducer"

const infoColumns = [
  {
    key: 'address',
    header: 'Address',
    format: (address: string) => {
      return (
        <code>{address}</code>
      )
    }
  },
  {
    key: 'balance',
    header: 'Balance',
    format: displayAMOLong
  },
  {
    key: 'stake',
    header: 'Stake',
    format: displayAMOLong
  },
  {
    key: 'delegate',
    header: 'Delegate',
    format: displayAMOLong
  }
]

const Account = () => {
  const chainId = useChainId()
  const {address} = useParams()

  const [account, setAccount] = useState<AccountInfo>({
    address: address as string,
    balance: '0',
    chain_id: '',
    del_addr: '',
    delegate: '0',
    stake: '0',
    val_addr: '',
    val_power: '0',
    val_pubkey: ''
  })
  const [txs, setTxs] = useState<TransactionSchema[]>([])
  const [incentives, setIncentives] = useState<Incentive[]>([])
  const [statLoading, setStatLoading] = useState(true)
  const [tab, setTab] = useState<number>(0)
  const dispatch = useDispatch()

  const handleTabChange = (e: React.ChangeEvent<{}>, newValue: number) => {
    setTab(newValue)
  }

  useEffect(() => {
    if (chainId && address) {
      ExplorerAPI
        .fetchAccount(chainId, address as string)
        .then(({data}) => {
          setAccount(data)
          setTxs([])
          setStatLoading(false)
        })
        .catch((e: AxiosError) => {
          dispatch(replace(`/${chainId}/inspect/404`, {type: 'ACCOUNT', search: address}))
          setStatLoading(false)
        })
    }
  }, [chainId, address, dispatch])

  const fetchAccountTransactions = async (from: number, num: number) => {
    ExplorerAPI
      .fetchAccountTransactions(chainId, address, 0, from, num)
      .then(({data}) => {
        setTxs(txs.concat(data))
      })
  }

  const fetchAccountIncentives = async (from: number, num: number) => {
    ExplorerAPI
      .fetchAccountIncentives(chainId, address, 0, from, num)
      .then(({data}) => {
        setIncentives(incentives.concat(data))
      })
  }

  return (
    <>
      <InformationCard
        title="Account information"
        columns={infoColumns}
        data={account}
        divider
        loading={statLoading}
      />
      <Container>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label="Sent Txs"/>
          <Tab label="Incentives"/>
          <Tab label="Penalties"/>
        </Tabs>
      </Container>
      <Container style={{padding:"0 8px"}}>
        <div hidden={tab !== 0}>
          <InfiniteTable
            rows={txs}
            columns={txColumns2}
            loadMoreRows={fetchAccountTransactions}
          />
        </div>
        <div hidden={tab !== 1}>
          <InfiniteTable
            rows={incentives}
            columns={incentiveColumns}
            loadMoreRows={fetchAccountIncentives}
          />
        </div>
      </Container>
    </>
  )
}

export default Account
