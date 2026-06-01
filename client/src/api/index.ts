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

// ------ 采购订单相关接口 ------
export const createPOApi = (data: any) =>
  fetch("/api/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());

export const getPOListApi = () =>
  fetch("/api/purchase").then((res) => res.json());

export const receivePOApi = (id: string) =>
  fetch(`/api/purchase/${id}/receive`, {
    method: "POST",
  }).then((res) => res.json());

export const createPrdOApi = (data: any) =>
  fetch("/api/production", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());

export const getPrdOListApi = () =>
  fetch("/api/production").then((res) => res.json());

export const completePrdOApi = (id: string) =>
  fetch(`/api/production/${id}/complete`, {
    method: "POST",
  }).then((res) => res.json());

export const getDashboardOverviewApi = () =>
  fetch("/api/dashboard/overview").then((res) => res.json());

export const publishBomApi = (parentId: string) =>
  fetch(`/api/bom/${parentId}/publish`, {
    method: "POST",
  }).then((res) => res.json());

// ------ 库存与台账相关接口 ------
// 获取当前所有仓库的实时库存列表
export const getInventoryListApi = () =>
  fetch("/api/inventory").then((res) => res.json());

export const transferStockApi = (data: any) =>
  fetch("/api/inventory/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());

// ------ 供应商主数据接口 ------
// 获取所有启用的供应商列表
export const getSuppliersApi = () =>
  fetch("/api/suppliers").then((res) => res.json());

// 创建新供应商档案
export const createSupplierApi = (data: any) =>
  fetch("/api/suppliers", {
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

export const getWarehousesApi = () =>
  fetch("/api/warehouses").then((res) => res.json());

export const createWarehouseApi = (data: any) =>
  fetch("/api/warehouses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());

export const runMrpApi = (data: { productId: string; quantity: number }) =>
  fetch("/api/mrp/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
