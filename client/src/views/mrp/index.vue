<template>
  <div class="mrp-container">
    <el-card class="box-card" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold; font-size: 16px"
            >🎯 MRP (物料需求计划) 运算控制台</span
          >
        </div>
      </template>

      <el-form :inline="true" :model="mrpForm" class="mrp-form">
        <el-form-item label="生产目标物料">
          <el-select
            v-model="mrpForm.productId"
            placeholder="请选择产成品 (FERT)"
            filterable
            style="width: 250px"
          >
            <el-option
              v-for="item in fertOptions"
              :key="item.id"
              :label="`[${item.sku}] ${item.name}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="目标产量">
          <el-input-number v-model="mrpForm.quantity" :min="1" :step="1" />
        </el-form-item>

        <el-form-item label="期望交付日期">
          <el-date-picker
            v-model="mrpForm.dueDate"
            type="date"
            placeholder="选择交付日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="runMrp"
            icon="Cpu"
          >
            执行 MRP 运算
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="mrpData.length > 0">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold">📊 采购与开工建议看板</span>
          <span style="margin-left: 15px; font-size: 13px; color: #f56c6c">
            *
            红色高亮行代表：当前提前期无法满足交期，已出现进度倒挂，需要加急处理或动用安全库存！
          </span>
        </div>
      </template>

      <el-table
        :data="mrpData"
        border
        style="width: 100%"
        :row-class-name="tableRowClassName"
      >
        <el-table-column label="结构层级 / 物料名称" min-width="220">
          <template #default="scope">
            <div :style="{ paddingLeft: scope.row.level * 20 + 'px' }">
              <el-tag size="small" type="info" style="margin-right: 8px"
                >L{{ scope.row.level }}</el-tag
              >
              <span
                :style="{
                  fontWeight: scope.row.level === 0 ? 'bold' : 'normal',
                }"
                >{{ scope.row.name }}</span
              >
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="sku" label="SKU" width="160" />

        <el-table-column prop="type" label="类型" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'ROH' ? 'warning' : 'success'">{{
              scope.row.type
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="grossRequirement" label="毛需求量" width="100" />
        <el-table-column prop="currentStock" label="当前库存" width="100" />
        <el-table-column prop="safetyStock" label="安全库存" width="100" />

        <el-table-column prop="netRequirement" label="净需求量" width="110">
          <template #default="scope">
            <span
              style="font-weight: bold; font-size: 16px"
              :style="{
                color: scope.row.netRequirement > 0 ? '#409EFF' : '#67C23A',
              }"
            >
              {{ scope.row.netRequirement }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="leadTime" label="提前期" width="80">
          <template #default="scope">{{ scope.row.leadTime }} 天</template>
        </el-table-column>

        <el-table-column
          prop="suggestedReleaseDate"
          label="最晚下单/开工时间"
          min-width="160"
        >
          <template #default="scope">
            <div style="font-weight: bold">
              {{ formatDate(scope.row.suggestedReleaseDate) }}
              <el-tag
                v-if="isUrgent(scope.row.suggestedReleaseDate)"
                type="danger"
                size="small"
                effect="dark"
                style="margin-left: 8px"
                >急单</el-tag
              >
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import { getProductsApi, calculateMrpApi } from "../../api/index";

const allProducts = ref<any[]>([]);
const loading = ref(false);
const mrpData = ref<any[]>([]);

// 默认期望交付日期为 15 天后
const defaultDate = new Date();
defaultDate.setDate(defaultDate.getDate() + 15);

const mrpForm = reactive({
  productId: "",
  quantity: 100,
  dueDate: defaultDate.toISOString().split("T")[0],
});

// 仅允许选择产成品或半成品作为 MRP 的驱动源
const fertOptions = computed(() => {
  return allProducts.value.filter(
    (p) => p.type === "FERT" || p.type === "HALB",
  );
});

const fetchProducts = async () => {
  const res = await getProductsApi();
  if (res.success) {
    allProducts.value = res.data;
  }
};

onMounted(() => {
  fetchProducts();
});

const runMrp = async () => {
  if (!mrpForm.productId) {
    return ElMessage.warning("请先选择要生产的物料");
  }
  if (!mrpForm.dueDate) {
    return ElMessage.warning("请选择期望交付日期");
  }

  loading.value = true;
  mrpData.value = []; // 清空旧数据
  try {
    const res = await calculateMrpApi(mrpForm);
    if (res.success) {
      mrpData.value = res.data;
      ElMessage.success("MRP 运算完成！");
    } else {
      ElMessage.error(res.message || "运算失败");
    }
  } catch (error) {
    ElMessage.error("网络请求失败");
  } finally {
    loading.value = false;
  }
};

// 格式化日期显示
const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

// 核心逻辑：判断是否进度倒挂（建议日期早于今天）
const isUrgent = (dateStr: string) => {
  if (!dateStr) return false;
  const suggestedDate = new Date(dateStr);
  const today = new Date();
  // 忽略时分秒进行比较
  today.setHours(0, 0, 0, 0);
  suggestedDate.setHours(0, 0, 0, 0);
  return suggestedDate < today;
};

// 给倒挂的行添加特殊的 CSS class 标红
const tableRowClassName = ({ row }: { row: any }) => {
  if (isUrgent(row.suggestedReleaseDate)) {
    return "urgent-row";
  }
  return "";
};
</script>

<style>
.mrp-container {
  padding: 10px;
}
/* 紧急订单的行高亮样式 */
.el-table .urgent-row {
  --el-table-tr-bg-color: #fef0f0;
}
.el-table .urgent-row:hover > td {
  background-color: #fde2e2 !important;
}
</style>
