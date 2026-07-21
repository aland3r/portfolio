import { USE_CASE_PRODUCTS } from '@gestalt/auth'
import UseCasesProductRedirect from '../../components/UseCasesProductRedirect'

export function generateStaticParams() {
  return USE_CASE_PRODUCTS.map((product) => ({ product: product.code }))
}

export default function UseCasesProductRoutePage() {
  return <UseCasesProductRedirect />
}
