<template>
  <div class="mrp-container">
    <el-card>
      <template #header>
        <span style="font-weight: bold">📊 MRP 智能物料需求计划推演沙盘</span>
      </template>

      <el-form :inline="true" :model="queryForm">
        <el-form-item label="模拟目标产成品">
          <el-select
            v-model="queryForm.productId"
            placeholder="选择成品"
            filterable
            style="width: 250px"
          >
            <el-option
              v-for="p in productOptions"
              :key="p.id"
              :label="p.name"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="期望产量">
          <el-input-number v-model="queryForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="calculating" @click="handleRunMrp"
            >执行运算推演</el-button
          >
        </el-form-item>
      </el-form>

      <el-table :data="mrpResult.components" border v-loading="calculating">
        <el-table-column prop="sku" label="物料 SKU" width="140" />
        <el-table-column prop="name" label="物料名称" min-width="150" />
        <el-table-column prop="grossRequirement" label="毛需求" width="100" />
        <el-table-column prop="currentStock" label="当前系统库存" width="120" />
        <el-table-column prop="netRequirement" label="净缺口" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.netRequirement > 0 ? 'danger' : 'success'">
              {{ scope.row.netRequirement }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="建议动作" width="180">
          <template #default="scope">
            <span
              :style="{
                color: scope.row.netRequirement > 0 ? '#f56c6c' : '#67c23a',
                fontWeight: 'bold',
              }"
            >
              {{ scope.row.action }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="suggestOrderDate"
          label="最晚下单日期"
          width="140"
        />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import { getProductsApi, runMrpApi } from "../../api/index";

const queryForm = reactive({ productId: "", quantity: 1 });
const allProducts = ref<any[]>([]);
const mrpResult = ref<any>({ components: [] });
const calculating = ref(false);

const productOptions = computed(() =>
  allProducts.value.filter((p) => p.type === "FERT"),
);

const fetchData = async () => {
  const res = await getProductsApi();
  if (res.success) allProducts.value = res.data;
};

const handleRunMrp = async () => {
  if (!queryForm.productId) return ElMessage.warning("请先选择目标成品");
  calculating.value = true;
  try {
    const res = await runMrpApi(queryForm);
    if (res.success) {
      mrpResult.value = res.data;
      ElMessage.success("MRP 逻辑运算完毕");
    } else {
      ElMessage.error(res.message);
    }
  } finally {
    calculating.value = false;
  }
};

onMounted(() => fetchData());
</script>
