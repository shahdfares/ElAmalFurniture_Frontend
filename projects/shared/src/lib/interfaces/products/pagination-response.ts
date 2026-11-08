export interface PaginationResponse<T> {
pageIndex: number,
pageSize: number,
count:number,
data:T[]
}
