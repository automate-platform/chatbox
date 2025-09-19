import { useMemo } from "react"
import { A2AClient, A2AClientInterface } from "src/shared/utils/a2a_util"



export const useA2AClient = () => {
    const a2aClient:A2AClientInterface = useMemo(() => {
        return new A2AClient;
    }, [])
    return a2aClient
}