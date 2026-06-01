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

// BOM 相关接口
export const addBomItemApi = (data: {
  parentId: string;
  childId: string;
  quantity: number;
}) =>
  fetch("/api/bom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());

export const getBomTreeApi = (parentId: string) =>
  fetch(`/api/bom/${parentId}/tree`).then((res) => res.json());

export const bulkImportProductsApi = (data: any[]) =>
  fetch("/api/products/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());

export const updateProductApi = (id: string, data: any) =>
  fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());

export const getSingleLevelBomApi = (parentId: string) =>
  fetch(`/api/bom/${parentId}/single`).then((res) => res.json());

export const removeBomItemApi = (id: string) =>
  fetch(`/api/bom/${id}`, { method: "DELETE" }).then((res) => res.json());

// MRP 相关接口
export const calculateMrpApi = (data: {
  productId: string;
  quantity: number;
  dueDate: string | Date;
}) =>
  fetch("/api/mrp/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
