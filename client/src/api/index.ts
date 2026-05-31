// 商品相关接口
export const getProductsApi = () =>
  fetch("/api/products").then((res) => res.json());

export const createProductApi = (data: any) =>
  fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());

// 库存与台账相关接口
export const processMovementApi = (data: any) =>
  fetch("/api/inventory/movement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());

export const getLedgerApi = (productId: string) =>
  fetch(`/api/inventory/${productId}/ledger`).then((res) => res.json());
