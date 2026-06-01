<template>
  <div class="dashboard-container">
    <h2 style="margin-top: 0; color: #303133">📈 ERP 生产制造决策中枢</h2>

    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <el-statistic title="系统物料种类 (SKU)" :value="overview.totalSku" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <el-statistic
            title="系统总库存量 (件)"
            :value="overview.stockDistribution.total"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card
          shadow="hover"
          class="data-card"
          style="border-left: 4px solid #e6a23c"
        >
          <el-statistic
            title="待收货采购单 (PO)"
            :value="overview.pendingPO"
            value-style="color: #E6A23C;"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card
          shadow="hover"
          class="data-card"
          style="border-left: 4px solid #409eff"
        >
          <el-statistic
            title="生产中工单 (PrdO)"
            :value="overview.pendingPrdO"
            value-style="color: #409EFF;"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span style="font-weight: bold">📊 实时库存结构健康度</span>
          </template>

          <div class="progress-item">
            <span>产成品 (FERT) - 随时可发货</span>
            <el-progress
              :text-inside="true"
              :stroke-width="24"
              :percentage="calcPercentage(overview.stockDistribution.fert)"
              status="success"
            />
            <div class="stock-num">
              {{ overview.stockDistribution.fert }} 件
            </div>
          </div>

          <div class="progress-item">
            <span>半成品 (HALB) - 生产中转区</span>
            <el-progress
              :text-inside="true"
              :stroke-width="24"
              :percentage="calcPercentage(overview.stockDistribution.halb)"
            />
            <div class="stock-num">
              {{ overview.stockDistribution.halb }} 件
            </div>
          </div>

          <div class="progress-item">
            <span>原材料 (ROH) - 供应链弹药库</span>
            <el-progress
              :text-inside="true"
              :stroke-width="24"
              :percentage="calcPercentage(overview.stockDistribution.roh)"
              status="warning"
            />
            <div class="stock-num">{{ overview.stockDistribution.roh }} 件</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span style="font-weight: bold">🚀 核心业务流快捷入口</span>
          </template>
          <div class="shortcut-grid">
            <el-button
              type="primary"
              size="large"
              plain
              @click="$router.push('/mrp')"
              >运算 MRP 计划</el-button
            >
            <el-button
              type="success"
              size="large"
              plain
              @click="$router.push('/purchase')"
              >管理采购订单</el-button
            >
            <el-button
              type="warning"
              size="large"
              plain
              @click="$router.push('/production')"
              >下达生产工单</el-button
            >
            <el-button
              type="info"
              size="large"
              plain
              @click="$router.push('/bom')"
              >维护 BOM 结构</el-button
            >
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getDashboardOverviewApi } from "../../api/index";

const overview = ref({
  totalSku: 0,
  stockDistribution: { total: 0, fert: 0, halb: 0, roh: 0 },
  pendingPO: 0,
  pendingPrdO: 0,
});

const fetchData = async () => {
  const res = await getDashboardOverviewApi();
  if (res.success) {
    overview.value = res.data;
  }
};

// 计算进度条百分比
const calcPercentage = (val: number) => {
  const total = overview.value.stockDistribution.total;
  if (total === 0) return 0;
  return Number(((val / total) * 100).toFixed(1));
};

onMounted(() => fetchData());
</script>

<style scoped>
.dashboard-container {
  padding: 10px;
}
.data-card {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.progress-item {
  margin-bottom: 25px;
}
.progress-item span {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #606266;
  font-size: 14px;
}
.stock-num {
  text-align: right;
  font-size: 13px;
  color: #909399;
  margin-top: 5px;
}
.shortcut-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 10px 0;
}
</style>
