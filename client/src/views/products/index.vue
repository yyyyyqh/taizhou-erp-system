<template>
  <div class="product-container">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="物料与库存台账" name="list">
        <el-table
          v-loading="tableLoading"
          :data="productList"
          border
          stripe
          style="width: 100%; margin-top: 15px"
        >
          <el-table-column prop="sku" label="SKU" width="150" />
          <el-table-column prop="name" label="物料名称" min-width="180" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="scope">
              <el-tag
                :type="
                  scope.row.type === 'FERT'
                    ? 'success'
                    : scope.row.type === 'ROH'
                      ? 'warning'
                      : 'info'
                "
              >
                {{
                  scope.row.type === "FERT"
                    ? "产成品"
                    : scope.row.type === "ROH"
                      ? "原材料"
                      : "半成品"
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="stock" label="当前库存" width="100">
            <template #default="scope">
              <el-tag
                :type="
                  scope.row.stock > scope.row.safetyStock ? 'success' : 'danger'
                "
              >
                {{ scope.row.stock }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="safetyStock" label="安全库存" width="100" />
          <el-table-column prop="leadTime" label="提前期(天)" width="100" />
          <el-table-column prop="warehouseLocation" label="库位" width="120" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <el-button
                size="small"
                type="primary"
                @click="openMovementDialog(scope.row)"
                >出入库</el-button
              >
              <el-button size="small" @click="openLedgerDialog(scope.row)"
                >台账</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="新建物料入库" name="create">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="120px"
          style="margin-top: 20px; max-width: 600px"
        >
          <el-form-item label="物料 SKU" prop="sku"
            ><el-input v-model="formData.sku"
          /></el-form-item>
          <el-form-item label="物料名称" prop="name"
            ><el-input v-model="formData.name"
          /></el-form-item>

          <el-form-item label="物料类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择物料类型"
              style="width: 100%"
            >
              <el-option label="产成品 (FERT)" value="FERT" />
              <el-option label="半成品 (HALB)" value="HALB" />
              <el-option label="原材料 (ROH)" value="ROH" />
            </el-select>
          </el-form-item>

          <el-form-item label="单价" prop="price"
            ><el-input-number
              v-model="formData.price"
              :precision="2"
              :step="1"
              :min="0"
          /></el-form-item>

          <el-divider>计划参数 (MRP核心)</el-divider>
          <el-form-item label="安全库存" prop="safetyStock">
            <el-input-number
              v-model="formData.safetyStock"
              :min="0"
              :step="1"
            />
          </el-form-item>
          <el-form-item label="提前期(天)" prop="leadTime">
            <el-input-number v-model="formData.leadTime" :min="0" :step="1" />
          </el-form-item>

          <el-divider>初始库存</el-divider>
          <el-form-item label="初始数量" prop="initialStock"
            ><el-input-number
              v-model="formData.initialStock"
              :min="0"
              :step="1"
          /></el-form-item>
          <el-form-item label="仓库库位"
            ><el-input v-model="formData.warehouseLocation"
          /></el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="submitLoading"
              @click="submitForm"
              >提交保存</el-button
            >
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="movementDialogVisible"
      title="物料出入库操作"
      width="500px"
    >
      <el-form
        ref="movementFormRef"
        :model="movementForm"
        :rules="movementRules"
        label-width="100px"
      >
        <el-form-item label="变动类型" prop="type">
          <el-radio-group v-model="movementForm.type">
            <el-radio label="IN" value="IN">入库</el-radio>
            <el-radio label="OUT" value="OUT">出库</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="变动数量" prop="quantity">
          <el-input-number v-model="movementForm.quantity" :min="1" :step="1" />
        </el-form-item>
        <el-form-item label="关联单号" prop="referenceId">
          <el-input
            v-model="movementForm.referenceId"
            placeholder="如：PO-20260531-001"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="movementDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="movementLoading"
          @click="submitMovement"
          >确认提交</el-button
        >
      </template>
    </el-dialog>

    <el-dialog v-model="ledgerDialogVisible" title="库存流水台账" width="700px">
      <el-table
        :data="ledgerList"
        border
        v-loading="ledgerLoading"
        height="400px"
      >
        <el-table-column prop="type" label="业务类型" width="100">
          <template #default="scope">
            <el-tag
              :type="
                scope.row.type === 'IN' || scope.row.type === 'INIT'
                  ? 'success'
                  : 'danger'
              "
            >
              {{
                scope.row.type === "IN"
                  ? "入库"
                  : scope.row.type === "OUT"
                    ? "出库"
                    : "系统初始化"
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="变动数量" width="100" />
        <el-table-column prop="balance" label="结余" width="100" />
        <el-table-column prop="referenceId" label="关联单号" min-width="150" />
        <el-table-column prop="createdAt" label="操作时间" width="180">
          <template #default="scope">{{
            new Date(scope.row.createdAt).toLocaleString()
          }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  getProductsApi,
  createProductApi,
  processMovementApi,
  getLedgerApi,
} from "../../api/index";

const activeTab = ref("list");
const tableLoading = ref(false);
const productList = ref([]);

const fetchProducts = async () => {
  tableLoading.value = true;
  try {
    const result = await getProductsApi();
    if (result.success) productList.value = result.data;
  } catch (error) {
    ElMessage.error("获取列表失败");
  } finally {
    tableLoading.value = false;
  }
};

const handleTabChange = (tabName: string) => {
  if (tabName === "list") fetchProducts();
};

onMounted(() => fetchProducts());

const formRef = ref();
const submitLoading = ref(false);
const formData = reactive({
  sku: "",
  name: "",
  type: "FERT",
  price: 0,
  leadTime: 0,
  safetyStock: 0,
  attributes: { brand: "", material: "", carModel: "" },
  initialStock: 0,
  warehouseLocation: "",
});

const rules = {
  sku: [{ required: true, message: "请输入物料 SKU", trigger: "blur" }],
  name: [{ required: true, message: "请输入物料名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择物料类型", trigger: "change" }],
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true;
      try {
        const result = await createProductApi(formData);
        if (result.success) {
          ElMessage.success("物料创建及库存初始化成功");
          formRef.value.resetFields();
          formData.attributes = { brand: "", material: "", carModel: "" };
          activeTab.value = "list";
          fetchProducts();
        } else {
          ElMessage.error(result.message || "操作失败");
        }
      } catch (error) {
        ElMessage.error("网络请求失败");
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

const movementDialogVisible = ref(false);
const movementLoading = ref(false);
const movementFormRef = ref();
const movementForm = reactive({
  productId: "",
  type: "IN",
  quantity: 1,
  referenceId: "",
});

const movementRules = {
  type: [{ required: true, message: "请选择变动类型", trigger: "change" }],
  quantity: [{ required: true, message: "请输入变动数量", trigger: "blur" }],
};

const openMovementDialog = (row: any) => {
  movementForm.productId = row.id;
  movementForm.type = "IN";
  movementForm.quantity = 1;
  movementForm.referenceId = "";
  movementDialogVisible.value = true;
};

const submitMovement = async () => {
  if (!movementFormRef.value) return;
  await movementFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      movementLoading.value = true;
      try {
        const result = await processMovementApi(movementForm);
        if (result.success) {
          ElMessage.success("库存变动成功");
          movementDialogVisible.value = false;
          fetchProducts();
        } else {
          ElMessage.error(result.message || "操作失败");
        }
      } catch (error) {
        ElMessage.error("网络请求失败");
      } finally {
        movementLoading.value = false;
      }
    }
  });
};

const ledgerDialogVisible = ref(false);
const ledgerLoading = ref(false);
const ledgerList = ref([]);

const openLedgerDialog = async (row: any) => {
  ledgerDialogVisible.value = true;
  ledgerLoading.value = true;
  ledgerList.value = [];
  try {
    const result = await getLedgerApi(row.id);
    if (result.success) {
      ledgerList.value = result.data;
    } else {
      ElMessage.error(result.message || "获取台账失败");
    }
  } catch (error) {
    ElMessage.error("网络请求失败");
  } finally {
    ledgerLoading.value = false;
  }
};
</script>

<style scoped>
.product-container {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}
</style>
