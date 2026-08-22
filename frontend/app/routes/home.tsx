import { Toaster } from "~/components/ui/toast";
import DatabaseConnectionPage from "./connection"

export default function Home() {
  return <>
    <DatabaseConnectionPage />
    <Toaster />
  </>
}
