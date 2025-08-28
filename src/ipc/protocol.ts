

export type IWorkerMessage = (callback: IWorkerMessageCallback) => void
export type IWorkerMessageCallback = (event:string, payload: any) => void