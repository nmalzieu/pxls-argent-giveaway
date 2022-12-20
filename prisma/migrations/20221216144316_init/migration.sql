-- CreateTable
CREATE TABLE "Signatures" (
    "wallet" TEXT NOT NULL,
    "tweet" TEXT,

    CONSTRAINT "Signatures_pkey" PRIMARY KEY ("wallet")
);
