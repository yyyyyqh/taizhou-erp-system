<template>
  <div class="purchase-container">
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
            >🛒 采购订单 (PO) 管理</span
          >
          <el-button type="primary" @click="openCreateDialog">
            + 新建采购单
          </el-button>
        </div>
      </template>

      <el-table :data="poList" border stripe v-loading="loading">
        <el-table-column type="expand">
          <template #default="props">
            <div style="padding: 10px 20px; background-color: #f8f9fa">
              <h4 style="margin-top: 0; color: #606266">
                单据明细 (Line Items)
              </h4>
              <el-table :data="props.row.items" border size="small">
                <el-table-column prop="sku" label="物料 SKU" width="150" />
                <el-table-column prop="name" label="物料名称" min-width="180" />
                <el-table-column prop="quantity" label="采购数量" width="100" />
                <el-table-column prop="unitPrice" label="单价" width="100">
                  <template #default="scope"
                    >¥{{ scope.row.unitPrice }}</template
                  >
                </el-table-column>
                <el-table-column label="小计" width="100">
                  <template #default="scope">
                    <span style="font-weight: bold"
                      >¥{{
                        (scope.row.quantity * scope.row.unitPrice).toFixed(2)
                      }}</span
                    >
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="poNumber"
          label="采购单号"
          width="200"
          style="font-weight: bold"
        />
        <el-table-column prop="supplier" label="供应商" min-width="150" />
        <el-table-column prop="expectedDate" label="预计交期" width="120">
          <template #default="scope">
            {{
              scope.row.expectedDate
                ? scope.row.expectedDate.substring(0, 10)
                : "-"
            }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="制单时间" width="160">
          <template #default="scope">
            {{ new Date(scope.row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag
              :type="scope.row.status === 'COMPLETED' ? 'success' : 'warning'"
            >
              {{ scope.row.status === "COMPLETED" ? "已收货" : "待收货" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
              size="small"
              type="success"
              :disabled="scope.row.status === 'COMPLETED'"
              @click="handleReceive(scope.row)"
            >
              收货入库
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="创建采购单" width="700px">
      <el-form :model="poForm" label-width="90px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商">
              <el-input
                v-model="poForm.supplier"
                placeholder="输入供应商名称"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计交期">
              <el-date-picker
                v-model="poForm.expectedDate"
                type="date"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider>采购明细 (Items)</el-divider>

        <div
          v-for="(item, index) in poForm.items"
          :key="index"
          style="
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
            align-items: center;
          "
        >
          <el-select
            v-model="item.productId"
            placeholder="选择物料 (ROH/HALB)"
            filterable
            style="flex: 2"
          >
            <el-option
              v-for="p in materialOptions"
              :key="p.id"
              :label="`[${p.sku}] ${p.name}`"
              :value="p.id"
            />
          </el-select>
          <el-input-number
            v-model="item.quantity"
            :min="1"
            placeholder="数量"
            style="flex: 1"
          />
          <el-input-number
            v-model="item.unitPrice"
            :min="0"
            :precision="2"
            placeholder="单价"
            style="flex: 1"
          />
          <el-button
            type="danger"
            icon="Delete"
            circle
            plain
            @click="removeItem(index)"
            :disabled="poForm.items.length === 1"
          />
        </div>

        <el-button
          type="primary"
          plain
          style="width: 100%; margin-top: 10px"
          @click="addItem"
        >
          + 添加一行明细
        </el-button>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitPO"
          >提交采购单</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getProductsApi,
  getPOListApi,
  createPOApi,
  receivePOApi,
} from "../../api/index";

const poList = ref<any[]>([]);
const loading = ref(false);
const allProducts = ref<any[]>([]);

// 采购单通常只买原材料(ROH)和半成品(HALB)
const materialOptions = computed(() =>
  allProducts.value.filter((p) => p.type === "ROH" || p.type === "HALB"),
);

const fetchPOList = async () => {
  loading.value = true;
  const res = await getPOListApi();
  if (res.success) poList.value = res.data;
  loading.value = false;
};

const fetchProducts = async () => {
  const res = await getProductsApi();
  if (res.success) allProducts.value = res.data;
};

onMounted(() => {
  fetchPOList();
  fetchProducts();
});

// ----- 新建单据逻辑 -----
const dialogVisible = ref(false);
const submitLoading = ref(false);

const poForm = reactive({
  supplier: "",
  expectedDate: "",
  items: [{ productId: "", quantity: 1, unitPrice: 0 }],
});

const openCreateDialog = () => {
  poForm.supplier = "";
  poForm.expectedDate = "";
  poForm.items = [{ productId: "", quantity: 1, unitPrice: 0 }];
  dialogVisible.value = true;
};

const addItem = () => {
  poForm.items.push({ productId: "", quantity: 1, unitPrice: 0 });
};

const removeItem = (index: number) => {
  poForm.items.splice(index, 1);
};

const submitPO = async () => {
  // 简单校验
  if (poForm.items.some((item) => !item.productId)) {
    return ElMessage.warning("请为所有明细行选择物料");
  }

  submitLoading.value = true;
  try {
    const res = await createPOApi(poForm);
    if (res.success) {
      ElMessage.success("采购单创建成功");
      dialogVisible.value = false;
      fetchPOList();
    } else {
      ElMessage.error("创建失败");
    }
  } finally {
    submitLoading.value = false;
  }
};

// ----- 收货逻辑 -----
const handleReceive = (row: any) => {
  ElMessageBox.confirm(
    `确定要对采购单 ${row.poNumber} 进行收货吗？此操作将自动增加库存并写入台账。`,
    "收货确认",
    { type: "warning" },
  )
    .then(async () => {
      try {
        const res = await receivePOApi(row.id);
        if (res.success) {
          ElMessage.success(res.message);
          fetchPOList(); // 刷新列表，状态将变为 COMPLETED
        } else {
          ElMessage.error(res.message);
        }
      } catch (e) {
        ElMessage.error("网络请求失败");
      }
    })
    .catch(() => {});
};
</script>

<style scoped>
.purchase-container {
  padding: 10px;
}
</style>
