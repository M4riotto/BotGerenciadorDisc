module.exports.messageModal = async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId === "falar_modal") {
    const mensagem = interaction.fields.getTextInputValue("mensagem");

    try {
      await interaction.deferReply({ flags: 64 });

      // Confirmação da mensagem enviada
      await interaction.followUp({
        content: "Mensagem enviada",
        flags: 64,
      });

      if (interaction.channel) {
        await interaction.channel.send(mensagem);
      } else {
        throw new Error("Canal não encontrado");
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      try {
        await interaction.followUp({
          content: "Ocorreu um erro ao enviar a mensagem.",
          flags: 64,
        });
      } catch (followUpError) {
        console.error("Erro ao enviar follow-up:", followUpError);
        return;
      }
    }
  }
};
