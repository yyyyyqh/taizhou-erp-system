<template>
  <div class="inventory-container">
    <el-card>
      <template #header>
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <span style="font-weight: bold; font-size: 16px"
            >📦 实时库存与物理仓位看板</span
          >

          <div>
            <el-button type="info" plain icon="Download" disabled
              >导出台账</el-button
            >
            <el-button type="warning" icon="Switch" @click="openTransferDialog"
              >内部库存调拨 (移库)</el-button
            >
          </div>
        </div>
      </template>

      <el-table :data="inventoryList" border stripe v-loading="loading">
        <el-table-column prop="sku" label="物料 SKU" width="160" />
        <el-table-column prop="name" label="物料名称" min-width="180" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="scope">
            <el-tag
              :type="
                scope.row.type === 'ROH'
                  ? 'warning'
                  : scope.row.type === 'FERT'
                    ? 'success'
                    : 'info'
              "
            >
              {{ scope.row.type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="warehouseName" label="所在仓库" width="180">
          <template #default="scope">
            <el-tag
              effect="dark"
              :type="getWarehouseColor(scope.row.warehouseName)"
            >
              <el-icon style="margin-right: 4px"><House /></el-icon>
              {{ scope.row.warehouseName }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="stock" label="实时可用库存" width="150">
          <template #default="scope">
            <span style="font-weight: bold; font-size: 16px; color: #409eff">
              {{ scope.row.stock }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="最后变动时间" width="180">
          <template #default="scope">
            {{ new Date(scope.row.updatedAt).toLocaleString() }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="transferDialogVisible"
      title="内部库存调拨单 (STO)"
      width="500px"
    >
      <el-form :model="transferForm" label-width="100px">
        <el-form-item label="调拨物料" required>
          <el-select
            v-model="transferForm.productId"
            filterable
            placeholder="请选择要调拨的物料"
            style="width: 100%"
          >
            <el-option
              v-for="item in allProducts"
              :key="item.id"
              :label="`[${item.sku}] ${item.name}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="调出仓库" required>
          <el-select v-model="transferForm.fromWhCode" style="width: 100%">
            <el-option label="原材料大仓 (W-MAIN)" value="W-MAIN" />
            <el-option label="车间线边仓 (W-WIP)" value="W-WIP" />
            <el-option label="成品发货仓 (W-FG)" value="W-FG" />
          </el-select>
        </el-form-item>

        <el-form-item label="调入仓库" required>
          <el-select v-model="transferForm.toWhCode" style="width: 100%">
            <el-option label="原材料大仓 (W-MAIN)" value="W-MAIN" />
            <el-option label="车间线边仓 (W-WIP)" value="W-WIP" />
            <el-option label="成品发货仓 (W-FG)" value="W-FG" />
          </el-select>
        </el-form-item>

        <el-form-item label="调拨数量" required>
          <el-input-number
            v-model="transferForm.quantity"
            :min="1"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <div
        style="
          color: #909399;
          font-size: 12px;
          line-height: 1.5;
          margin-left: 100px;
        "
      >
        * 提示：<br />
        1. 采购收货默认进入【原材料大仓】。<br />
        2. 车间生产必须从【线边仓】扣减原材料。请确保生产前已执行调拨。
      </div>

      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="transferLoading"
          @click="submitTransfer"
          >确认调拨并记账</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  getInventoryListApi,
  transferStockApi,
  getProductsApi,
} from "../../api/index";
import { House } from "@element-plus/icons-vue";

const inventoryList = ref<any[]>([]);
const allProducts = ref<any[]>([]);
const loading = ref(false);

// 获取库存列表
const fetchInventory = async () => {
  loading.value = true;
  try {
    const res = await getInventoryListApi();
    if (res.success) inventoryList.value = res.data;
  } finally {
    loading.value = false;
  }
};

// 获取物料列表 (供下拉框使用)
const fetchProducts = async () => {
  const res = await getProductsApi();
  if (res.success) allProducts.value = res.data;
};

onMounted(() => {
  fetchInventory();
  fetchProducts();
});

// 根据仓库类型给个好看的颜色
const getWarehouseColor = (name: string) => {
  if (name.includes("大仓")) return "primary";
  if (name.includes("线边")) return "warning";
  if (name.includes("成品")) return "success";
  return "info";
};

// ----- 调拨逻辑 -----
const transferDialogVisible = ref(false);
const transferLoading = ref(false);
const transferForm = reactive({
  productId: "",
  fromWhCode: "W-MAIN",
  toWhCode: "W-WIP",
  quantity: 1,
});

const openTransferDialog = () => {
  transferForm.productId = "";
  transferForm.quantity = 1;
  transferDialogVisible.value = true;
};

const submitTransfer = async () => {
  if (!transferForm.productId) return ElMessage.warning("请选择调拨物料");
  if (transferForm.fromWhCode === transferForm.toWhCode)
    return ElMessage.warning("调出和调入不能是同一个仓库！");

  transferLoading.value = true;
  try {
    const res = await transferStockApi(transferForm);
    if (res.success) {
      ElMessage.success("调拨成功，台账已更新！");
      transferDialogVisible.value = false;
      fetchInventory(); // 刷新列表
    } else {
      ElMessage.error(res.message || "调拨失败");
    }
  } catch (e) {
    ElMessage.error("网络请求失败");
  } finally {
    transferLoading.value = false;
  }
};
</script>

<style scoped>
.inventory-container {
  padding: 10px;
}
</style>
