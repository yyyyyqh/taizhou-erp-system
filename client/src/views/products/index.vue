<template>
  <div class="product-container">
    <div style="margin-bottom: 15px; display: flex; gap: 10px">
      <el-upload
        action=""
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleExcelImport"
        accept=".xlsx, .xls"
      >
        <el-button type="success" :loading="importLoading"
          >一键导入 Excel</el-button
        >
      </el-upload>
      <el-button type="info" plain @click="downloadTemplate"
        >下载导入模板</el-button
      >
    </div>
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
              <el-button
                size="small"
                type="warning"
                @click="openEditDialog(scope.row)"
                >编辑</el-button
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
            <el-radio value="IN">入库</el-radio>
            <el-radio value="OUT">出库</el-radio>
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
        <el-table-column prop="warehouseName" label="变动仓库" width="130" />
        <el-table-column prop="quantity" label="变动数量" width="100" />
        <el-table-column prop="balance" label="单仓结余" width="100" />
        <el-table-column prop="referenceNo" label="关联单号" min-width="150" />
        <el-table-column prop="createdAt" label="操作时间" width="180">
          <template #default="scope">{{
            new Date(scope.row.createdAt).toLocaleString()
          }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog
      v-model="editDialogVisible"
      title="修改物料主数据属性"
      width="520px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="rules"
        label-width="110px"
        style="padding: 10px 20px 0 10px"
      >
        <el-form-item label="物料 SKU">
          <el-input v-model="editForm.sku" disabled />
          <span style="font-size: 12px; color: #909399"
            >* 核心主键 SKU 编码在企业级 ERP 中建档后禁止篡改</span
          >
        </el-form-item>
        <el-form-item label="物料名称" prop="name">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="物料类型" prop="type">
          <el-select v-model="editForm.type" style="width: 100%">
            <el-option label="产成品 (FERT)" value="FERT" />
            <el-option label="半成品 (HALB)" value="HALB" />
            <el-option label="原材料 (ROH)" value="ROH" />
          </el-select>
        </el-form-item>
        <el-form-item label="参考单价" prop="price">
          <el-input-number
            v-model="editForm.price"
            :precision="2"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="安全库存" prop="safetyStock">
          <el-input-number
            v-model="editForm.safetyStock"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="提前期(天)" prop="leadTime">
          <el-input-number
            v-model="editForm.leadTime"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit"
          >保存修改</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import * as XLSX from "xlsx";
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  getProductsApi,
  createProductApi,
  processMovementApi,
  getLedgerApi,
  bulkImportProductsApi,
  updateProductApi, // 💡 引入更新接口
} from "../../api/index";

const activeTab = ref("list");
const tableLoading = ref(false);
const productList = ref([]);
const importLoading = ref(false);

// Excel 动态包含映射解析
const handleExcelImport = (file: any) => {
  importLoading.value = true;
  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const formattedData = jsonData.map((row: any) => {
        const keys = Object.keys(row);
        const getValueByKeyword = (keyword: string) => {
          const matchedKey = keys.find((k) => k.includes(keyword));
          return matchedKey ? row[matchedKey] : undefined;
        };

        const extractedType = getValueByKeyword("类型")
          ?.toString()
          .trim()
          .toUpperCase();

        return {
          sku: getValueByKeyword("编码") || getValueByKeyword("SKU"),
          name: getValueByKeyword("名称"),
          type: extractedType,
          price: getValueByKeyword("单价") || 0,
          safetyStock: getValueByKeyword("安全库存") || 0,
          leadTime: getValueByKeyword("提前期") || 0,
        };
      });

      if (formattedData.some((item) => !item.sku || !item.name || !item.type)) {
        throw new Error(
          "检测到必要字段（编码/名称/类型）解析为空，请检查模板格式",
        );
      }

      const res = await bulkImportProductsApi(formattedData);
      if (res.success) {
        ElMessage.success("Excel 物料主数据批量导入成功");
        fetchProducts();
      } else {
        ElMessage.error(res.message || "导入失败，请检查 SKU 是否有重复");
      }
    } catch (error: any) {
      ElMessage.error(error.message || "解析 Excel 文件失败");
    } finally {
      importLoading.value = false;
    }
  };

  reader.readAsArrayBuffer(file.raw);
};

const downloadTemplate = () => {
  const templateData = [
    {
      "物料编码(SKU)": "ROH-001",
      物料名称: "标准钢材",
      "类型(FERT/HALB/ROH)": "ROH",
      参考单价: 15.5,
      安全库存: 100,
      "提前期(天)": 3,
    },
  ];
  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "物料导入模板");
  XLSX.writeFile(wb, "物料主数据导入模板.xlsx");
};

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

// ----- 新增物料逻辑 -----
const formRef = ref();
const submitLoading = ref(false);
const formData = reactive({
  sku: "",
  name: "",
  type: "FERT",
  price: 0,
  leadTime: 0,
  safetyStock: 0,
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
          ElMessage.success("物料创建成功");
          formRef.value.resetFields();
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

// ----- 💡 补全功能：物料编辑响应式状态与逻辑 -----
const editDialogVisible = ref(false);
const editLoading = ref(false);
const editFormRef = ref();
const editForm = reactive({
  id: "",
  sku: "",
  name: "",
  type: "FERT",
  price: 0,
  leadTime: 0,
  safetyStock: 0,
});

const openEditDialog = (row: any) => {
  editForm.id = row.id;
  editForm.sku = row.sku;
  editForm.name = row.name;
  editForm.type = row.type;
  editForm.price = Number(row.price) || 0;
  editForm.leadTime = row.leadTime || 0;
  editForm.safetyStock = row.safetyStock || 0;
  editDialogVisible.value = true;
};

const submitEdit = async () => {
  if (!editFormRef.value) return;
  await editFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      editLoading.value = true;
      try {
        const result = await updateProductApi(editForm.id, editForm);
        if (result.success) {
          ElMessage.success("物料主数据属性更新成功");
          editDialogVisible.value = false;
          fetchProducts(); // 刷新表格视图
        } else {
          ElMessage.error(result.message || "修改失败");
        }
      } catch (error) {
        ElMessage.error("网络连接异常，未成功保存修改");
      } finally {
        editLoading.value = false;
      }
    }
  });
};

// ----- 手工出入库逻辑 -----
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

// ----- 流水台账展示 -----
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
