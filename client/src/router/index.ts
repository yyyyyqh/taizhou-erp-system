import { createRouter, createWebHistory } from "vue-router";
import Layout from "../layout/index.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: Layout,
      redirect: "/products",
      children: [
        {
          path: "products",
          name: "Products",
          component: () => import("../views/products/index.vue"),
        },
      ],
    },
  ],
});

export default router;
