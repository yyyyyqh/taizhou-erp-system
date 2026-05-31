<template>
  <div class="bom-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>生产 BOM (物料清单) 设计器</span>
        </div>
      </template>

      <div class="filter-section">
        <span style="margin-right: 15px; font-weight: bold">当前设计目标:</span>
        <el-select
          v-model="selectedParentId"
          placeholder="请选择产成品 (FERT) 或 半成品 (HALB)"
          style="width: 400px"
          @change="fetchBomTree"
          filterable
        >
          <el-option
            v-for="item in parentOptions"
            :key="item.id"
            :label="`[${item.sku}] ${item.name}`"
            :value="item.id"
          />
        </el-select>

        <el-button
          type="primary"
          style="margin-left: 20px"
          :disabled="!selectedParentId"
          @click="addDialogVisible = true"
        >
          + 添加子组件 / 原材料
        </el-button>
      </div>

      <el-divider />

      <el-table
        v-loading="tableLoading"
        :data="bomTreeData"
        border
        style="width: 100%"
      >
        <el-table-column label="结构层级 / 物料名称" min-width="250">
          <template #default="scope">
            <div :style="{ paddingLeft: (scope.row.level - 1) * 30 + 'px' }">
              <el-tag size="small" type="info" style="margin-right: 8px"
                >L{{ scope.row.level }}</el-tag
              >
              <span style="font-weight: bold">{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="sku" label="SKU" width="180" />

        <el-table-column prop="type" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'ROH' ? 'warning' : 'success'">
              {{ scope.row.type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="unit_quantity" label="单件用量" width="120">
          <template #default="scope">
            <span style="color: #409eff; font-weight: bold">{{
              scope.row.unit_quantity
            }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="total_quantity" label="累计总需求" width="120">
          <template #default="scope">
            <span style="color: #f56c6c; font-weight: bold">{{
              scope.row.total_quantity
            }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="lead_time" label="提前期(天)" width="100" />
      </el-table>
    </el-card>

    <el-dialog v-model="addDialogVisible" title="添加下级物料" width="500px">
      <el-form ref="formRef" :model="formData" label-width="100px">
        <el-form-item label="选择子件" required>
          <el-select
            v-model="formData.childId"
            placeholder="选择原材料或半成品"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="item in childOptions"
              :key="item.id"
              :label="`[${item.type}] ${item.name} (${item.sku})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="消耗数量" required>
          <el-input-number
            v-model="formData.quantity"
            :min="0.01"
            :precision="2"
            :step="1"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitAdd"
          >确认添加</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import { getProductsApi, getBomTreeApi, addBomItemApi } from "../../api/index";

const allProducts = ref<any[]>([]);
const parentOptions = computed(() =>
  allProducts.value.filter((p) => p.type === "FERT" || p.type === "HALB"),
);
const childOptions = computed(() => allProducts.value); // 理论上可以选任何物料，但通常是 ROH 或 HALB

const selectedParentId = ref("");
const bomTreeData = ref([]);
const tableLoading = ref(false);

// 初始化获取所有物料下拉列表
const fetchAllProducts = async () => {
  try {
    const res = await getProductsApi();
    if (res.success) allProducts.value = res.data;
  } catch (error) {
    ElMessage.error("获取物料列表失败");
  }
};

// 获取选定成品的 BOM 树
const fetchBomTree = async () => {
  if (!selectedParentId.value) return;
  tableLoading.value = true;
  try {
    const res = await getBomTreeApi(selectedParentId.value);
    if (res.success) bomTreeData.value = res.data;
  } catch (error) {
    ElMessage.error("获取 BOM 树失败");
  } finally {
    tableLoading.value = false;
  }
};

onMounted(() => {
  fetchAllProducts();
});

// 添加子件逻辑
const addDialogVisible = ref(false);
const submitLoading = ref(false);
const formData = reactive({ childId: "", quantity: 1 });

const submitAdd = async () => {
  if (!formData.childId) return ElMessage.warning("请选择子件");

  submitLoading.value = true;
  try {
    const res = await addBomItemApi({
      parentId: selectedParentId.value,
      childId: formData.childId,
      quantity: formData.quantity,
    });

    if (res.success) {
      ElMessage.success("添加成功");
      addDialogVisible.value = false;
      formData.childId = "";
      formData.quantity = 1;
      fetchBomTree(); // 刷新树
    } else {
      ElMessage.error(res.message || "添加失败");
    }
  } catch (error) {
    ElMessage.error("网络错误");
  } finally {
    submitLoading.value = false;
  }
};
</script>

<style scoped>
.bom-container {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}
.filter-section {
  padding: 10px 0 20px 0;
  display: flex;
  align-items: center;
}
</style>
