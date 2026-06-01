<template>
  <div class="production-container">
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
            >⚙️ 生产工单 (PrdO) 管理</span
          >
          <el-button type="primary" @click="dialogVisible = true"
            >+ 下达生产工单</el-button
          >
        </div>
      </template>

      <el-table :data="orderList" border stripe v-loading="loading">
        <el-table-column
          prop="orderNumber"
          label="工单号"
          width="200"
          style="font-weight: bold"
        />
        <el-table-column prop="sku" label="目标物料 SKU" width="160" />
        <el-table-column prop="name" label="物料名称" min-width="180" />
        <el-table-column prop="quantity" label="计划生产数量" width="120">
          <template #default="scope">
            <span style="font-weight: bold; color: #409eff">{{
              scope.row.quantity
            }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="startDate" label="计划开工日期" width="120">
          <template #default="scope">
            {{
              scope.row.startDate ? scope.row.startDate.substring(0, 10) : "-"
            }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag
              :type="scope.row.status === 'COMPLETED' ? 'success' : 'warning'"
            >
              {{ scope.row.status === "COMPLETED" ? "已完工" : "生产中" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
              size="small"
              type="success"
              :disabled="scope.row.status === 'COMPLETED'"
              @click="handleComplete(scope.row)"
            >
              完工汇报
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 下达工单弹窗 -->
    <el-dialog v-model="dialogVisible" title="下达生产工单" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="目标物料" required>
          <el-select
            v-model="form.productId"
            placeholder="请选择产成品或半成品"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="p in productOptions"
              :key="p.id"
              :label="`[${p.sku}] ${p.name}`"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="生产数量" required>
          <el-input-number
            v-model="form.quantity"
            :min="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="计划开工">
          <el-date-picker
            v-model="form.startDate"
            type="date"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitOrder"
          >确认下达</el-button
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
  getPrdOListApi,
  createPrdOApi,
  completePrdOApi,
} from "../../api/index";

const orderList = ref<any[]>([]);
const loading = ref(false);
const allProducts = ref<any[]>([]);

// 仅允许生产产成品(FERT)和半成品(HALB)
const productOptions = computed(() =>
  allProducts.value.filter((p) => p.type === "FERT" || p.type === "HALB"),
);

const fetchData = async () => {
  loading.value = true;
  const [orderRes, productRes] = await Promise.all([
    getPrdOListApi(),
    getProductsApi(),
  ]);
  if (orderRes.success) orderList.value = orderRes.data;
  if (productRes.success) allProducts.value = productRes.data;
  loading.value = false;
};

onMounted(() => fetchData());

const dialogVisible = ref(false);
const submitLoading = ref(false);
const form = reactive({ productId: "", quantity: 1, startDate: "" });

const submitOrder = async () => {
  if (!form.productId) return ElMessage.warning("请选择生产物料");
  submitLoading.value = true;
  try {
    const res = await createPrdOApi(form);
    if (res.success) {
      ElMessage.success("工单下达成功");
      dialogVisible.value = false;
      fetchData();
    } else {
      ElMessage.error("下达失败");
    }
  } finally {
    submitLoading.value = false;
  }
};

const handleComplete = (row: any) => {
  ElMessageBox.confirm(
    `确认工单 ${row.orderNumber} 完工？系统将自动增加入库，并扣减下级物料库存。`,
    "完工汇报",
    { type: "warning" },
  )
    .then(async () => {
      try {
        const res = await completePrdOApi(row.id);
        if (res.success) {
          ElMessage.success(res.message);
          fetchData();
        } else {
          ElMessage.error(res.message || "操作失败");
        }
      } catch (e) {
        ElMessage.error("网络请求失败");
      }
    })
    .catch(() => {});
};
</script>

<style scoped>
.production-container {
  padding: 10px;
}
</style>
