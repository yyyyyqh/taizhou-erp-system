<template>
  <div class="bom-container">
    <el-card>
      <div class="filter-section">
        <span style="font-weight: bold; margin-right: 15px">当前目标物料:</span>
        <el-select
          v-model="selectedParentId"
          placeholder="请选择要维护或预览的 产成品/半成品"
          style="width: 400px"
          @change="handleParentChange"
          filterable
        >
          <el-option
            v-for="item in parentOptions"
            :key="item.id"
            :label="`[${item.sku}] ${item.name}`"
            :value="item.id"
          />
        </el-select>
      </div>
    </el-card>

    <el-tabs
      v-model="activeTab"
      type="border-card"
      style="margin-top: 15px"
      v-if="selectedParentId"
    >
      <el-tab-pane label="🛠️ 单层结构维护 (草稿区)" name="single">
        <div
          style="
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          "
        >
          <div>
            <el-button type="primary" @click="addDialogVisible = true"
              >+ 添加直接子组件/原材料</el-button
            >
            <span
              style="
                margin-left: 15px;
                color: #e6a23c;
                font-size: 13px;
                font-weight: bold;
              "
            >
              ⚠️
              注意：此处的所有修改默认保存在【草稿】中。必须点击右侧的发布按钮，MRP
              与生产工单才能读取到最新配方！
            </span>
          </div>
          <el-button
            type="success"
            size="large"
            :loading="publishLoading"
            @click="handlePublish"
          >
            🚀 发布并生效配方
          </el-button>
        </div>

        <el-table :data="singleLevelData" border v-loading="tableLoading">
          <el-table-column prop="sku" label="子件 SKU" width="180" />
          <el-table-column prop="name" label="子件名称" min-width="200" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="scope">
              <el-tag
                :type="scope.row.type === 'ROH' ? 'warning' : 'success'"
                >{{ scope.row.type }}</el-tag
              >
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="单件消耗量" width="150">
            <template #default="scope">
              <span
                style="color: #409eff; font-weight: bold; font-size: 16px"
                >{{ scope.row.quantity }}</span
              >
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button
                size="small"
                type="danger"
                @click="handleRemove(scope.row.id)"
                >移除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="👁️ 多层结构全览 (已生效版本)" name="multi">
        <div style="margin-bottom: 10px; color: #67c23a; font-size: 13px">
          * 此视图展示的是当前系统中处于
          <b>ACTIVE (已生效)</b> 状态的配方树。MRP 将完全依据此树进行演算。
        </div>
        <el-table
          :data="bomTreeData"
          border
          v-loading="tableLoading"
          row-class-name="tree-row"
        >
          <el-table-column label="结构层级 / 物料名称" min-width="250">
            <template #default="scope">
              <div :style="{ paddingLeft: (scope.row.level - 1) * 30 + 'px' }">
                <el-tag size="small" type="info" style="margin-right: 8px"
                  >L{{ scope.row.level }}</el-tag
                >
                <span
                  :style="{
                    fontWeight: scope.row.level === 1 ? 'bold' : 'normal',
                  }"
                  >{{ scope.row.name }}</span
                >
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="sku" label="SKU" width="180" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="scope">
              <el-tag
                :type="scope.row.type === 'ROH' ? 'warning' : 'success'"
                >{{ scope.row.type }}</el-tag
              >
            </template>
          </el-table-column>
          <el-table-column
            prop="unit_quantity"
            label="本层单件用量"
            width="120"
          />
          <el-table-column prop="total_quantity" label="累计总需求" width="120">
            <template #default="scope">
              <span style="color: #f56c6c; font-weight: bold">{{
                scope.row.total_quantity
              }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="lead_time" label="提前期(天)" width="100" />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="addDialogVisible"
      title="添加直接下级物料"
      width="500px"
    >
      <el-form :model="formData" label-width="100px">
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
              :disabled="item.id === selectedParentId"
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
import { ref, reactive, onMounted, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getProductsApi,
  getBomTreeApi,
  addBomItemApi,
  getSingleLevelBomApi,
  removeBomItemApi,
  publishBomApi,
} from "../../api/index";

const allProducts = ref<any[]>([]);
const parentOptions = computed(() =>
  allProducts.value.filter((p) => p.type === "FERT" || p.type === "HALB"),
);
const childOptions = computed(() => allProducts.value);

const selectedParentId = ref("");
const activeTab = ref("single");
const tableLoading = ref(false);

const singleLevelData = ref([]);
const bomTreeData = ref([]);

const fetchAllProducts = async () => {
  const res = await getProductsApi();
  if (res.success) allProducts.value = res.data;
};

const loadData = async () => {
  if (!selectedParentId.value) return;
  tableLoading.value = true;
  try {
    if (activeTab.value === "single") {
      const res = await getSingleLevelBomApi(selectedParentId.value);
      if (res.success) singleLevelData.value = res.data;
    } else {
      const res = await getBomTreeApi(selectedParentId.value);
      if (res.success) bomTreeData.value = res.data;
    }
  } catch (error) {
    ElMessage.error("获取数据失败");
  } finally {
    tableLoading.value = false;
  }
};

const handleParentChange = () => {
  loadData();
};

watch(activeTab, () => {
  loadData();
});

onMounted(() => fetchAllProducts());

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
      ElMessage.success("已存入草稿区");
      addDialogVisible.value = false;
      formData.childId = "";
      formData.quantity = 1;
      loadData();
    }
  } finally {
    submitLoading.value = false;
  }
};

const handleRemove = (bomId: string) => {
  ElMessageBox.confirm("确定要移除该子件吗？", "提示", { type: "warning" })
    .then(async () => {
      const res = await removeBomItemApi(bomId);
      if (res.success) {
        ElMessage.success("已移除");
        loadData();
      }
    })
    .catch(() => {});
};

// ----- 核心：发布并生效 BOM -----
const publishLoading = ref(false);
const handlePublish = async () => {
  if (!selectedParentId.value) return ElMessage.warning("请先选择目标物料");

  ElMessageBox.confirm(
    "确认发布此配方？发布后将覆盖之前的历史版本，且立即对后续的 MRP 运算和生产工单生效。",
    "发布配方",
    { type: "warning", confirmButtonText: "确定发布" },
  )
    .then(async () => {
      publishLoading.value = true;
      try {
        const res = await publishBomApi(selectedParentId.value);
        if (res.success) {
          ElMessage.success(res.message);
          loadData();
        } else {
          ElMessage.error(res.message || "发布失败");
        }
      } catch (e) {
        ElMessage.error("网络请求失败");
      } finally {
        publishLoading.value = false;
      }
    })
    .catch(() => {});
};
</script>

<style scoped>
.bom-container {
  padding: 10px;
}
.filter-section {
  display: flex;
  align-items: center;
}
</style>
